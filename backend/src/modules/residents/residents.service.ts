import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role } from '../../common/enums';
import { tenantContext } from '../../common/context/tenant-context';

interface CreateResidentInput {
  condominiumId: string;
  unitId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  document?: string;
}

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateResidentInput) {
    return this.prisma.resident.create({ data });
  }

  async findAll(params: {
    condominiumId?: string;
    userRole?: string;
    userCondominiumId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, userRole, userCondominiumId } = params;
    const where: Record<string, unknown> = {};

    // Enforce condominium isolation
    if (userRole !== Role.SUPER_ADMIN && userCondominiumId) {
      where.condominiumId = userCondominiumId;
    } else if (params.condominiumId) {
      where.condominiumId = params.condominiumId;
    }

    const ctx = tenantContext.getStore();
    if (ctx?.organizationId) {
      where.condominium = { organizationId: ctx.organizationId };
    }

    const [data, total] = await Promise.all([
      this.prisma.resident.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
          condominium: { select: { id: true, name: true } },
        },
        orderBy: { fullName: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.resident.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ctx = tenantContext.getStore();
    const where: Record<string, unknown> = { id };
    
    if (ctx?.organizationId) {
      where.condominium = { organizationId: ctx.organizationId };
    }

    const resident = await this.prisma.resident.findFirst({
      where: where as any,
      include: {
        unit: { include: { block: true } },
        condominium: { select: { id: true, name: true } },
        conversations: { take: 5, orderBy: { lastMessageAt: 'desc' } },
        occurrences: { take: 5, orderBy: { openedAt: 'desc' } },
      },
    });
    if (!resident) throw new NotFoundException('Resident not found');
    return resident;
  }

  async update(id: string, data: Partial<CreateResidentInput>) {
    await this.findOne(id);
    return this.prisma.resident.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.resident.delete({ where: { id } });
  }

  async search(params: { name?: string; phone?: string; unit?: string; condominiumId?: string }) {
    const where: Record<string, unknown> = {};
    const ctx = tenantContext.getStore();
    if (ctx?.organizationId) {
      where.condominium = { organizationId: ctx.organizationId };
    }
    if (params.condominiumId) where.condominiumId = params.condominiumId;
    if (params.name) where.fullName = { contains: params.name, mode: 'insensitive' };
    if (params.phone) where.phone = { contains: params.phone };
    if (params.unit) where.unit = { number: { contains: params.unit } };

    return this.prisma.resident.findMany({
      where,
      include: {
        unit: { select: { id: true, number: true } },
        condominium: { select: { id: true, name: true } },
      },
      take: 20,
    });
  }

  async findByPhone(phone: string) {
    // Basic normalization for matching: remove +55 if it exists to match local numbers
    let searchPhone = phone;
    if (phone.startsWith('55') && phone.length >= 12) {
      searchPhone = phone.substring(2);
    }
    
    const ctx = tenantContext.getStore();
    const where: Record<string, unknown> = { 
      phone: { endsWith: searchPhone },
      status: 'active' 
    };
    
    if (ctx?.organizationId) {
      where.condominium = { organizationId: ctx.organizationId };
    }
    
    return this.prisma.resident.findFirst({
      where: where as any,
      include: { condominium: true, unit: true },
    });
  }
}
