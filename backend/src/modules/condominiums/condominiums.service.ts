import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCondominiumDto } from './dto/create-condominium.dto';
import { UpdateCondominiumDto } from './dto/update-condominium.dto';
import { tenantContext } from '../../common/context/tenant-context';

@Injectable()
export class CondominiumsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateCondominiumDto, actorId: string) {
    const ctx = tenantContext.getStore();
    const orgId = ctx?.organizationId;

    if (!orgId) {
      throw new BadRequestException('Organization context is missing');
    }

    const condominium = await this.prisma.condominium.create({ 
      data: { ...dto, organizationId: orgId } 
    });

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
    const ctx = tenantContext.getStore();
    
    const where: Record<string, unknown> = {};
    if (ctx?.organizationId) {
      where.organizationId = ctx.organizationId;
    }
    
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.condominium.findMany({
        where,
        include: {
          _count: { select: { residents: true, units: true } },
          internalUsers: {
            where: { role: { in: ['SINDICO', 'ADMIN'] } },
            select: { fullName: true, phone: true, email: true },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.condominium.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ctx = tenantContext.getStore();
    const where: Record<string, unknown> = { id };
    
    if (ctx?.organizationId) {
      where.organizationId = ctx.organizationId;
    }

    const condominium = await this.prisma.condominium.findUnique({
      where: where as any,
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
    const condominium = await this.findOne(id);

    if (status === 'inactive' && condominium._count.residents > 0) {
      throw new BadRequestException('Não é possível inativar um condomínio que possui moradores vinculados.');
    }

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

  async delete(id: string, actorId: string) {
    const condominium = await this.findOne(id);

    if (condominium._count.residents > 0) {
      throw new BadRequestException('Não é possível excluir um condomínio que possui moradores vinculados.');
    }

    await this.audit.log({
      condominiumId: id,
      entityType: 'Condominium',
      entityId: id,
      action: 'DELETE',
      actorType: 'user',
      actorId,
    });

    await this.prisma.condominium.delete({
      where: { id },
    });

    return { success: true };
  }
}
