import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

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
        description: `Occurrence created: ${data.title}`,
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

  async findOne(id: string) {
    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id },
      include: {
        resident: true,
        category: true,
        assignedUser: { select: { id: true, fullName: true, email: true } },
        condominium: { select: { id: true, name: true } },
        conversation: { select: { id: true, channel: true, status: true } },
        timeline: { orderBy: { createdAt: 'desc' } },
        alerts: true,
        attachments: true,
      },
    });
    if (!occurrence) throw new NotFoundException('Occurrence not found');
    return occurrence;
  }

  async update(id: string, data: Partial<CreateOccurrenceInput>, actorId: string) {
    await this.findOne(id);
    const updated = await this.prisma.occurrence.update({ where: { id }, data });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'UPDATED',
        description: 'Occurrence updated',
        actorType: 'user',
        actorId,
        metadata: data,
      },
    });

    return updated;
  }

  async updateStatus(id: string, status: string, actorId: string) {
    const occurrence = await this.findOne(id);

    const data: Record<string, unknown> = { status };
    if (status === 'closed' || status === 'resolved') {
      data.closedAt = new Date();
    }

    const updated = await this.prisma.occurrence.update({ where: { id }, data });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'STATUS_CHANGE',
        description: `Status changed to ${status}`,
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

    return updated;
  }

  async updatePriority(id: string, priority: string, actorId: string) {
    const occurrence = await this.findOne(id);

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: { priority },
    });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'PRIORITY_CHANGE',
        description: `Priority changed to ${priority}`,
        actorType: 'user',
        actorId,
        metadata: { oldPriority: occurrence.priority, newPriority: priority },
      },
    });

    return updated;
  }

  async assign(id: string, assignedUserId: string, actorId: string) {
    await this.findOne(id);

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: { assignedUserId },
    });

    await this.prisma.occurrenceTimeline.create({
      data: {
        occurrenceId: id,
        action: 'ASSIGNED',
        description: `Assigned to user ${assignedUserId}`,
        actorType: 'user',
        actorId,
        metadata: { assignedUserId },
      },
    });

    return updated;
  }
}
