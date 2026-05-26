import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { tenantContext } from '../../common/context/tenant-context';

interface CreateUserInput {
  condominiumId?: string;
  customRoleId?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  permissions?: Record<string, boolean>;
}

@Injectable()
export class InternalUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: CreateUserInput, actorId: string) {
    const existing = await this.prisma.internalUser.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const ctx = tenantContext.getStore();
    const orgId = ctx?.organizationId;

    if (!orgId) {
      throw new BadRequestException('Organization context is missing');
    }

    const user = await this.prisma.internalUser.create({
      data: {
        organizationId: orgId,
        condominiumId: data.condominiumId,
        customRoleId: data.customRoleId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions ?? {},
        passwordHash,
      },
      select: { id: true, email: true, fullName: true, role: true, customRoleId: true, permissions: true, condominiumId: true, status: true, createdAt: true },
    });

    await this.audit.log({
      condominiumId: data.condominiumId,
      entityType: 'InternalUser',
      entityId: user.id,
      action: 'CREATE',
      actorType: 'user',
      actorId,
    });

    return user;
  }

  async findAll(params: { condominiumId?: string; page?: number; limit?: number }) {
    const { condominiumId, page = 1, limit = 20 } = params;
    const ctx = tenantContext.getStore();
    
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    if (ctx?.organizationId) where.organizationId = ctx.organizationId;

    const [data, total] = await Promise.all([
      this.prisma.internalUser.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, phone: true, role: true,
          customRoleId: true, permissions: true, condominiumId: true, status: true, createdAt: true,
          condominium: { select: { id: true, name: true } },
          customRole: { select: { id: true, name: true, color: true, permissions: true } },
        },
        orderBy: { fullName: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.internalUser.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ctx = tenantContext.getStore();
    const where: Record<string, unknown> = { id };
    if (ctx?.organizationId) where.organizationId = ctx.organizationId;

    const user = await this.prisma.internalUser.findUnique({
      where: where as any,
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        customRoleId: true, permissions: true, condominiumId: true, status: true, createdAt: true,
        condominium: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, color: true, permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: Partial<Omit<CreateUserInput, 'password'>>, actorId: string) {
    await this.findOne(id);
    const user = await this.prisma.internalUser.update({
      where: { id },
      data,
      select: { id: true, email: true, fullName: true, role: true, permissions: true, condominiumId: true, status: true },
    });

    await this.audit.log({
      condominiumId: user.condominiumId,
      entityType: 'InternalUser',
      entityId: id,
      action: 'UPDATE',
      actorType: 'user',
      actorId,
      metadata: { changes: data },
    });

    return user;
  }

  async updateStatus(id: string, status: string, actorId: string) {
    if (id === actorId) throw new ConflictException('Não é possível alterar o próprio status');
    const user = await this.findOne(id);
    await this.prisma.internalUser.update({ where: { id }, data: { status } });

    await this.audit.log({
      condominiumId: user.condominiumId,
      entityType: 'InternalUser',
      entityId: id,
      action: 'STATUS_CHANGE',
      actorType: 'user',
      actorId,
      metadata: { newStatus: status },
    });

    return { id, status };
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) throw new ConflictException('Não é possível excluir o próprio usuário');
    const user = await this.findOne(id);
    
    await this.prisma.internalUser.delete({ where: { id } });

    await this.audit.log({
      condominiumId: user.condominiumId,
      entityType: 'InternalUser',
      entityId: id,
      action: 'DELETE',
      actorType: 'user',
      actorId,
    });

    return { success: true };
  }
}
