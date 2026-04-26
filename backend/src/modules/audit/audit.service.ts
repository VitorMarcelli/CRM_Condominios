import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface AuditLogInput {
  condominiumId?: string | null;
  entityType: string;
  entityId?: string;
  action: string;
  actorType: string;
  actorId?: string;
  metadata?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        condominiumId: input.condominiumId ?? undefined,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress,
      },
    });
  }

  async findAll(params: {
    condominiumId?: string;
    entityType?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const { condominiumId, entityType, action, page = 1, limit = 50 } = params;

    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
