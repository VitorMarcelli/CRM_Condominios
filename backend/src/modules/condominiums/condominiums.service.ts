import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCondominiumDto } from './dto/create-condominium.dto';
import { UpdateCondominiumDto } from './dto/update-condominium.dto';

@Injectable()
export class CondominiumsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateCondominiumDto, actorId: string) {
    const condominium = await this.prisma.condominium.create({ data: dto });

    await this.audit.log({
      condominiumId: condominium.id,
      entityType: 'Condominium',
      entityId: condominium.id,
      action: 'CREATE',
      actorType: 'user',
      actorId,
    });

    return condominium;
  }

  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.condominium.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.condominium.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const condominium = await this.prisma.condominium.findUnique({
      where: { id },
      include: {
        blocks: true,
        _count: { select: { residents: true, units: true, occurrences: true } },
      },
    });

    if (!condominium) throw new NotFoundException('Condominium not found');
    return condominium;
  }

  async update(id: string, dto: UpdateCondominiumDto, actorId: string) {
    await this.findOne(id);

    const updated = await this.prisma.condominium.update({ where: { id }, data: dto });

    await this.audit.log({
      condominiumId: id,
      entityType: 'Condominium',
      entityId: id,
      action: 'UPDATE',
      actorType: 'user',
      actorId,
      metadata: { changes: dto },
    });

    return updated;
  }

  async updateStatus(id: string, status: string, actorId: string) {
    await this.findOne(id);

    const updated = await this.prisma.condominium.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      condominiumId: id,
      entityType: 'Condominium',
      entityId: id,
      action: 'STATUS_CHANGE',
      actorType: 'user',
      actorId,
      metadata: { newStatus: status },
    });

    return updated;
  }
}
