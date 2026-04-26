import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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

    // Create alert recipients from dispatch group members
    for (const rule of rules) {
      if (rule.dispatchGroup) {
        for (const member of rule.dispatchGroup.members) {
          await this.prisma.alertRecipient.create({
            data: {
              alertId: alert.id,
              userId: member.userId,
              channel: 'whatsapp',
              status: 'pending',
            },
          });
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
