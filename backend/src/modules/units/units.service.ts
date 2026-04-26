import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(blockId: string, data: { number: string; floor?: string; condominiumId: string }) {
    return this.prisma.unit.create({
      data: { blockId, condominiumId: data.condominiumId, number: data.number, floor: data.floor },
    });
  }

  async findByBlock(blockId: string) {
    return this.prisma.unit.findMany({
      where: { blockId },
      include: { _count: { select: { residents: true } } },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        residents: true,
        block: { select: { id: true, name: true } },
        condominium: { select: { id: true, name: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, data: { number?: string; floor?: string; status?: string }) {
    await this.findOne(id);
    return this.prisma.unit.update({ where: { id }, data });
  }
}
