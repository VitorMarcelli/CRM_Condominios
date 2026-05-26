import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private evolution: EvolutionApiProvider,
  ) {}

  async trigger(data: {
    condominiumId: string;
    occurrenceId: string;
    triggerType: string;
    urgencyLevel: string;
  }, actorId?: string) {
    const alert = await this.prisma.alert.create({
      data: {
        condominiumId: data.condominiumId,
        occurrenceId: data.occurrenceId,
        triggerType: data.triggerType,
        urgencyLevel: data.urgencyLevel,
      },
    });

    // Find dispatch group members for this condominium and trigger type
    const rules = await this.prisma.escalationRule.findMany({
      where: {
        condominiumId: data.condominiumId,
        isActive: true,
      },
      include: {
        dispatchGroup: {
          include: { members: { include: { user: true } } },
        },
      },
    });

    // Create alert recipients from dispatch group members and send WhatsApp notifications
    const occurrence = await this.prisma.occurrence.findUnique({ 
      where: { id: data.occurrenceId },
      include: { 
        condominium: true, 
        resident: true,
        timeline: { where: { action: 'CREATED' }, take: 1 }
      }
    });
    
    const occText = `${occurrence?.title || ''} ${occurrence?.description || ''}`.toLowerCase();
    
    // Evaluate rules
    const matchedRules = rules.filter(rule => {
      // 1. Check urgency match (if rule specifies an urgency, it must match or be equal. If 'any', it catches all)
      if (rule.urgencyLevel && rule.urgencyLevel !== 'any' && rule.urgencyLevel !== data.urgencyLevel) {
        return false;
      }

      // 2. Check keywords match
      const keywords = (rule.triggerKeywords as string[]) || [];
      if (keywords.length === 0) return true; // If no keywords, match everything with that urgency
      
      return keywords.some(kw => occText.includes(kw.toLowerCase()));
    });

    let recipientsToNotify: Array<{ userId: string; phone: string | null }> = [];

    if (matchedRules.length > 0) {
      for (const rule of matchedRules) {
        if (rule.dispatchGroup) {
          for (const member of rule.dispatchGroup.members) {
             if (!recipientsToNotify.find(r => r.userId === member.userId)) {
               recipientsToNotify.push({ userId: member.userId, phone: member.user.phone });
             }
          }
        }
      }
    } else {
      // Fallback: If no rules matched, notify admins to guarantee delivery
      const admins = await this.prisma.internalUser.findMany({
        where: {
          OR: [
            { condominiumId: data.condominiumId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
            { role: 'SUPER_ADMIN', condominiumId: null },
          ],
          status: 'active',
        },
      });
      recipientsToNotify = admins.map(admin => ({ userId: admin.id, phone: admin.phone }));
    }

    // Now create the message string
    const condoName = occurrence?.condominium?.name || 'Condomínio';
    const metadata = occurrence?.timeline?.[0]?.metadata as any;
    const reporterName = occurrence?.resident?.fullName || metadata?.senderName || 'Não identificado';
    const reporterPhone = occurrence?.resident?.phone || metadata?.senderPhone || 'Não informado';
    
    const urgencyLabel = data.urgencyLevel === 'critical' ? 'CRÍTICO' : 'ALTO';
    const emoji = data.urgencyLevel === 'critical' ? '🚨' : '⚠️';

    const message = `${emoji} *ALERTA ${urgencyLabel} — ${condoName}*\n\nUma ocorrência grave requer sua atenção imediata!\n\n*ID:* ${alert.id.split('-')[0].toUpperCase()}\n*Título:* ${occurrence?.title || 'Não informada'}\n*Descrição:* ${occurrence?.description || 'Sem descrição'}\n\n👤 *Reportado por:* ${reporterName}\n📱 *Contato:* ${reporterPhone}\n\nAcesse o CRM para reconhecer o alerta.`;
    
    // Send notifications
    for (const recipientInfo of recipientsToNotify) {
       const recipient = await this.prisma.alertRecipient.create({
         data: {
           alertId: alert.id,
           userId: recipientInfo.userId,
           channel: 'whatsapp',
           status: 'pending',
         },
       });

       if (recipientInfo.phone) {
         try {
           await this.evolution.sendText(recipientInfo.phone, message);
           await this.updateRecipientStatus(recipient.id, 'sent');
         } catch (error) {
           console.error(`Failed to send WhatsApp alert to ${recipientInfo.phone}:`, error);
           await this.updateRecipientStatus(recipient.id, 'failed');
         }
       }
    }

    await this.audit.log({
      condominiumId: data.condominiumId,
      entityType: 'Alert',
      entityId: alert.id,
      action: 'TRIGGERED',
      actorType: actorId ? 'user' : 'system',
      actorId,
      metadata: { triggerType: data.triggerType, urgencyLevel: data.urgencyLevel },
    });

    return alert;
  }

  async findAll(params: { condominiumId?: string; status?: string; urgencyLevel?: string; occurrenceId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { condominiumId, status, urgencyLevel, occurrenceId, startDate, endDate, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    if (status) where.status = status;
    if (urgencyLevel) where.urgencyLevel = urgencyLevel;
    if (occurrenceId) where.occurrenceId = occurrenceId;
    if (startDate || endDate) {
      where.triggeredAt = {};
      if (startDate) (where.triggeredAt as any).gte = new Date(startDate);
      if (endDate) (where.triggeredAt as any).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: {
          occurrence: { select: { id: true, title: true, priority: true, status: true } },
          condominium: { select: { id: true, name: true } },
          recipients: { include: { user: { select: { id: true, fullName: true } } } },
        },
        orderBy: { triggeredAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        occurrence: true,
        condominium: { select: { id: true, name: true } },
        recipients: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
      },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }
  async updateStatus(id: string, status: string, actorId: string) {
    const alert = await this.findOne(id);
    const updated = await this.prisma.alert.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      condominiumId: alert.condominiumId,
      entityType: 'Alert',
      entityId: id,
      action: 'STATUS_CHANGE',
      actorType: 'user',
      actorId,
      metadata: { oldStatus: alert.status, newStatus: status },
    });

    return updated;
  }

  async acknowledge(id: string, actorId: string) {
    const alert = await this.findOne(id);
    const updated = await this.prisma.alert.update({
      where: { id },
      data: { status: 'acknowledged', acknowledgedAt: new Date() },
    });

    await this.audit.log({
      condominiumId: alert.condominiumId,
      entityType: 'Alert',
      entityId: id,
      action: 'ACKNOWLEDGED',
      actorType: 'user',
      actorId,
    });

    // Notify resident that the alert was acknowledged
    try {
      const actor = await this.prisma.internalUser.findUnique({
        where: { id: actorId },
        include: { customRole: true }
      });

      if (actor) {
        let roleLabel = actor.role === 'SUPER_ADMIN' ? 'Administração do Sistema' : 
                        actor.role === 'ADMIN' ? 'Síndico / Admin' : 
                        actor.customRole?.name || 'Equipe do Condomínio';

        const occurrence = await this.prisma.occurrence.findUnique({
          where: { id: alert.occurrenceId },
          include: { 
            resident: true,
            timeline: { where: { action: 'CREATED' }, take: 1 }
          }
        });

        const metadata = occurrence?.timeline?.[0]?.metadata as any;
        const residentPhone = occurrence?.resident?.phone || metadata?.senderPhone;

        if (residentPhone) {
           const message = `✅ *ALERTA RECONHECIDO*\n\nOlá! Passando para avisar que a ocorrência ("${occurrence?.title || 'Emergência'}") acabou de ser assumida por: *${roleLabel}* (${actor.fullName}).\n\nFique tranquilo(a), a situação já está em andamento!`;
           await this.evolution.sendText(residentPhone, message);
        }
      }
    } catch (error) {
      console.error('Failed to notify resident about alert acknowledgement:', error);
    }

    return updated;
  }

  async close(id: string, actorId: string) {
    const alert = await this.findOne(id);
    const updated = await this.prisma.alert.update({
      where: { id },
      data: { status: 'closed', closedAt: new Date() },
    });

    await this.audit.log({
      condominiumId: alert.condominiumId,
      entityType: 'Alert',
      entityId: id,
      action: 'CLOSED',
      actorType: 'user',
      actorId,
    });

    return updated;
  }

  async updateRecipientStatus(recipientId: string, status: string) {
    return this.prisma.alertRecipient.update({
      where: { id: recipientId },
      data: { status, ...(status === 'sent' ? { sentAt: new Date() } : {}) },
    });
  }
}
