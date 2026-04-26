import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async create(condominiumId: string, data: { name: string; code?: string }) {
    return this.prisma.block.create({
      data: { condominiumId, name: data.name, code: data.code },
    });
  }

  async findByCondominium(condominiumId: string) {
    return this.prisma.block.findMany({
      where: { condominiumId },
      include: { _count: { select: { units: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: { units: true, condominium: { select: { id: true, name: true } } },
    });
    if (!block) throw new NotFoundException('Block not found');
    return block;
  }

  async update(id: string, data: { name?: string; code?: string }) {
    await this.findOne(id);
    return this.prisma.block.update({ where: { id }, data });
  }
}
