import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BusinessHoursService {
  constructor(private prisma: PrismaService) {}

  async findByCondominium(condominiumId: string) {
    return this.prisma.businessHour.findMany({
      where: { condominiumId },
      orderBy: { weekday: 'asc' },
    });
  }

  async update(id: string, data: { startTime?: string; endTime?: string; isActive?: boolean }) {
    return this.prisma.businessHour.update({ where: { id }, data });
  }

  async isWithinBusinessHours(condominiumId: string, date?: Date): Promise<boolean> {
    const now = date || new Date();
    const weekday = now.getDay(); // 0=Sunday
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const businessHour = await this.prisma.businessHour.findFirst({
      where: { condominiumId, weekday, isActive: true },
    });

    if (!businessHour) return false;

    return currentTime >= businessHour.startTime && currentTime <= businessHour.endTime;
  }
}
