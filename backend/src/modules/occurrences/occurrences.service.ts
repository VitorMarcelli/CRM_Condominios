import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';
import { AlertsService } from '../alerts/alerts.service';

interface CreateOccurrenceInput {
  condominiumId: string;
  residentId?: string;
  conversationId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  priority?: string;
  assignedUserId?: string;
  metadata?: any;
}

@Injectable()
export class OccurrencesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private evolution: EvolutionApiProvider,
    private alerts: AlertsService,
  ) {}

  async create(data: CreateOccurrenceInput, actorId?: string) {
    const occurrence = await this.prisma.occurrence.create({
      data: {
        condominiumId: data.condominiumId,
        residentId: data.residentId,
        conversationId: data.conversationId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        assignedUserId: data.assignedUserId,
      },
    });

    // Create initial timeline entry
    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: occurrence.id,
        action: 'CREATED',
        description: `Chamado criado: ${data.title}`,
        actorType: actorId ? 'user' : 'system',
        actorId,
        metadata: data.metadata,
      },
    });

    if (actorId) {
      await this.audit.log({
        condominiumId: data.condominiumId,
        entityType: 'Occurrence',
        entityId: occurrence.id,
        action: 'CREATE',
        actorType: 'user',
        actorId,
      });
    }

    // Automatically trigger alert for high/critical manual occurrences
    if ((data.priority === 'critical' || data.priority === 'high') && data.metadata?.origin !== 'whatsapp_ai') {
      try {
        await this.alerts.trigger({
          condominiumId: data.condominiumId,
          occurrenceId: occurrence.id,
          triggerType: 'manual_creation',
          urgencyLevel: data.priority,
        }, actorId);
      } catch (error) {
        console.error('Failed to auto-trigger alert for manual occurrence:', error);
      }
    }

    return occurrence;
  }

  async findAll(params: {
    condominiumId?: string;
    status?: string;
    priority?: string;
    assignedUserId?: string;
    page?: number;
    limit?: number;
  }) {
    const { condominiumId, status, priority, assignedUserId, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const [data, total] = await Promise.all([
      this.prisma.occurrence.findMany({
        where,
        include: {
          resident: { select: { id: true, fullName: true, phone: true } },
          category: { select: { id: true, name: true, isEmergency: true } },
          assignedUser: { select: { id: true, fullName: true } },
          condominium: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.occurrence.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user?: any) {
    const isInternalViewer = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id },
      include: {
        resident: true,
        category: true,
        assignedUser: { select: { id: true, fullName: true, email: true } },
        condominium: { select: { id: true, name: true } },
        conversation: { select: { id: true, channel: true, status: true } },
        timeline: { 
          where: isInternalViewer ? undefined : { isInternal: false },
          orderBy: { createdAt: 'desc' } 
        },
        alerts: true,
        attachments: true,
      },
    });
    if (!occurrence) throw new NotFoundException('Occurrence not found');
    return occurrence;
  }

  async update(id: string, data: Partial<CreateOccurrenceInput>, actorId: string, user?: any) {
    await this.findOne(id, user);
    const updated = await this.prisma.occurrence.update({ where: { id }, data });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'UPDATED',
        description: 'Chamado atualizado',
        actorType: 'user',
        actorId,
        metadata: data,
      },
    });

    return updated;
  }

  async updateStatus(id: string, status: string, actorId: string, user?: any) {
    const occurrence = await this.findOne(id, user);

    if (status === 'resolved' && !occurrence.assignedUserId) {
      throw new BadRequestException('Não é possível resolver uma ocorrência sem um responsável atribuído.');
    }

    const data: Record<string, unknown> = { status };
    if (status === 'closed' || status === 'resolved') {
      data.closedAt = new Date();
    }

    const updated = await this.prisma.occurrence.update({ where: { id }, data });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'STATUS_CHANGE',
        description: `Status alterado para ${status}`,
        actorType: 'user',
        actorId,
        metadata: { oldStatus: occurrence.status, newStatus: status },
      },
    });

    await this.audit.log({
      condominiumId: occurrence.condominiumId,
      entityType: 'Occurrence',
      entityId: id,
      action: 'STATUS_CHANGE',
      actorType: 'user',
      actorId,
      metadata: { oldStatus: occurrence.status, newStatus: status },
    });

    if (status === 'resolved') {
      try {
        const metadata = occurrence?.timeline?.find((t: any) => t.action === 'CREATED')?.metadata as any;
        const residentPhone = occurrence?.resident?.phone || metadata?.senderPhone;

        if (residentPhone) {
           const message = `✅ *OCORRÊNCIA RESOLVIDA*\n\nOlá! Informamos que a sua solicitação ("${occurrence.title}") foi resolvida com sucesso pela nossa equipe!\n\nAgradecemos o contato e estamos à disposição.`;
           await this.evolution.sendText(residentPhone, message);
        }
      } catch (error) {
        console.error('Failed to send resolution WhatsApp to resident:', error);
      }
    }

    return updated;
  }

  async updatePriority(id: string, priority: string, actorId: string, user?: any) {
    const occurrence = await this.findOne(id, user);

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: { priority },
    });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'PRIORITY_CHANGE',
        description: `Prioridade alterada para ${priority}`,
        actorType: 'user',
        actorId,
        metadata: { oldPriority: occurrence.priority, newPriority: priority },
      },
    });

    return updated;
  }

  async assign(id: string, assignedUserId: string, actorId: string, user?: any) {
    await this.findOne(id, user);

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: { assignedUserId },
    });

    const userToAssign = await this.prisma.internalUser.findUnique({ where: { id: assignedUserId } });
    const assigneeName = userToAssign?.fullName || 'Usuário';

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'ASSIGNED',
        description: `Atribuído para ${assigneeName}`,
        actorType: 'user',
        actorId,
        metadata: { assignedUserId },
      },
    });

    return updated;
  }

  async addTimelineEntry(id: string, data: { description: string; isInternal?: boolean }, user: any) {
    const occurrence = await this.findOne(id, user);

    const timeline = await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'NOTE',
        description: data.description,
        isInternal: data.isInternal || false,
        actorType: 'user',
        actorId: user.sub,
      },
    });

    if (data.isInternal) {
      await this.audit.log({
        condominiumId: occurrence.condominiumId,
        entityType: 'OccurrenceTimeline',
        entityId: timeline.id,
        action: 'CREATE_INTERNAL_NOTE',
        actorType: 'user',
        actorId: user.sub,
        metadata: { occurrenceId: id },
      });
    }

    return timeline;
  }

  async remove(id: string, user: any) {
    const occurrence = await this.findOne(id, user);

    if (occurrence.status !== 'resolved' && occurrence.status !== 'closed') {
      throw new Error('Somente ocorrências resolvidas podem ser excluídas.');
    }

    // Prisma will cascade delete timelines and attachments if configured, 
    // otherwise we need to delete them manually. Assuming cascade is on for now, 
    // or we can manually delete timelines first.
    await this.prisma.occurrenceTimeline.deleteMany({
      where: { occurrenceId: id }
    });

    await this.prisma.occurrence.delete({
      where: { id }
    });

    await this.audit.log({
      condominiumId: occurrence.condominiumId,
      entityType: 'Occurrence',
      entityId: id,
      action: 'DELETE',
      actorType: 'user',
      actorId: user.sub,
    });

    return { success: true };
  }
}
