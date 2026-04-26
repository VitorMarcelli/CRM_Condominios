import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EscalationRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(condominiumId?: string) {
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    return this.prisma.escalationRule.findMany({
      where,
      include: { dispatchGroup: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    condominiumId: string;
    categoryId?: string;
    name: string;
    triggerKeywords?: string[];
    urgencyLevel: string;
    dispatchGroupId?: string;
  }) {
    return this.prisma.escalationRule.create({ data: { ...data, triggerKeywords: data.triggerKeywords } });
  }

  async findOne(id: string) {
    const rule = await this.prisma.escalationRule.findUnique({
      where: { id },
      include: { dispatchGroup: { select: { id: true, name: true } } },
    });
    if (!rule) throw new NotFoundException('Escalation rule not found');
    return rule;
  }

  async update(id: string, data: Partial<{
    name: string;
    triggerKeywords: string[];
    urgencyLevel: string;
    dispatchGroupId: string;
    isActive: boolean;
  }>) {
    const rule = await this.prisma.escalationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Escalation rule not found');
    return this.prisma.escalationRule.update({ where: { id }, data });
  }
}
