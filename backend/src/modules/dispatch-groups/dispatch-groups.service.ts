import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DispatchGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(condominiumId?: string) {
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    return this.prisma.dispatchGroup.findMany({
      where,
      include: { members: { include: { user: { select: { id: true, fullName: true, role: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { condominiumId: string; name: string; description?: string }) {
    return this.prisma.dispatchGroup.create({ data });
  }

  async findOne(id: string) {
    const group = await this.prisma.dispatchGroup.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, fullName: true, role: true, phone: true } } } } },
    });
    if (!group) throw new NotFoundException('Dispatch group not found');
    return group;
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    await this.findOne(id);
    return this.prisma.dispatchGroup.update({ where: { id }, data });
  }

  async addMember(groupId: string, userId: string, priority?: number) {
    return this.prisma.dispatchGroupMember.create({
      data: { dispatchGroupId: groupId, userId, priority: priority || 0 },
    });
  }

  async removeMember(groupId: string, userId: string) {
    await this.prisma.dispatchGroupMember.deleteMany({
      where: { dispatchGroupId: groupId, userId },
    });
    return { success: true };
  }
}
