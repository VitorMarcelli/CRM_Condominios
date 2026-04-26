import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OccurrenceCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(condominiumId?: string) {
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    return this.prisma.occurrenceCategory.findMany({ where, orderBy: { name: 'asc' } });
  }

  async create(data: { condominiumId?: string; name: string; severityDefault?: string; isEmergency?: boolean }) {
    return this.prisma.occurrenceCategory.create({ data });
  }

  async update(id: string, data: { name?: string; severityDefault?: string; isEmergency?: boolean }) {
    const category = await this.prisma.occurrenceCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.occurrenceCategory.update({ where: { id }, data });
  }
}
