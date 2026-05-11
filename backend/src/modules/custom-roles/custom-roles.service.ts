import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const DEFAULT_PERMISSIONS = {
  dashboard: { view: true },
  occurrences: { view: true, create: true, edit: true, assign: true, resolve: true, close: true, delete: false },
  conversations: { view: true, assign: true, respond: true, close: true },
  alerts: { view: true, acknowledge: true, dismiss: true },
  residents: { view: true, create: true, edit: true, delete: false },
  staff: { view: false, create: false, edit: false },
  condominiums: { view: false, manage: false },
  dispatch_groups: { view: true, manage: false },
  escalation_rules: { view: true, manage: false },
  audit_logs: { view: false },
};

export { DEFAULT_PERMISSIONS };

interface CreateRoleInput {
  name: string;
  description?: string;
  color?: string;
  permissions: Record<string, Record<string, boolean>>;
}

@Injectable()
export class CustomRolesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(data: CreateRoleInput, actorId: string) {
    const existing = await this.prisma.customRole.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Já existe um cargo com esse nome.');

    const role = await this.prisma.customRole.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3b82f6',
        permissions: data.permissions,
        isSystem: false,
      },
    });

    await this.audit.log({
      entityType: 'CustomRole',
      entityId: role.id,
      action: 'CREATE',
      actorType: 'user',
      actorId,
      metadata: { name: data.name },
    });

    return role;
  }

  async findAll() {
    return this.prisma.customRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { users: true } } },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Cargo não encontrado.');
    return role;
  }

  async update(id: string, data: Partial<CreateRoleInput>, actorId: string) {
    const role = await this.findOne(id);

    if (role.isSystem && data.name && data.name !== role.name) {
      throw new BadRequestException('Não é possível alterar o nome de um cargo do sistema.');
    }

    if (data.name && data.name !== role.name) {
      const dup = await this.prisma.customRole.findUnique({ where: { name: data.name } });
      if (dup) throw new ConflictException('Já existe um cargo com esse nome.');
    }

    const updated = await this.prisma.customRole.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions as any,
      },
    });

    await this.audit.log({
      entityType: 'CustomRole',
      entityId: id,
      action: 'UPDATE',
      actorType: 'user',
      actorId,
      metadata: { changes: data },
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Não é possível excluir um cargo do sistema.');
    }

    if (role._count.users > 0) {
      throw new BadRequestException(`Cargo em uso por ${role._count.users} usuário(s). Reatribua antes de excluir.`);
    }

    await this.prisma.customRole.delete({ where: { id } });

    await this.audit.log({
      entityType: 'CustomRole',
      entityId: id,
      action: 'DELETE',
      actorType: 'user',
      actorId,
      metadata: { name: role.name },
    });

    return { deleted: true };
  }

  getPermissionsTemplate() {
    return DEFAULT_PERMISSIONS;
  }
}
