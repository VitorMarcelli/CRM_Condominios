import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(condominiumId?: string) {
    const condFilter = condominiumId ? { condominiumId } : {};

    const [
      totalCondominiums,
      totalResidents,
      totalOpenOccurrences,
      totalCriticalOccurrences,
      totalAlerts,
      occurrencesByPriority,
      occurrencesByStatus,
    ] = await Promise.all([
      this.prisma.condominium.count({ where: { status: 'active' } }),
      this.prisma.resident.count({ where: { status: 'active', ...condFilter } }),
      this.prisma.occurrence.count({
        where: { status: { notIn: ['closed', 'resolved'] }, ...condFilter },
      }),
      this.prisma.occurrence.count({
        where: { priority: 'critical', status: { notIn: ['closed', 'resolved'] }, ...condFilter },
      }),
      this.prisma.alert.count({
        where: { status: { notIn: ['closed'] }, ...condFilter },
      }),
      this.prisma.occurrence.groupBy({
        by: ['priority'],
        _count: true,
        where: condFilter,
      }),
      this.prisma.occurrence.groupBy({
        by: ['status'],
        _count: true,
        where: condFilter,
      }),
    ]);

    return {
      totalCondominiums,
      totalResidents,
      totalOpenOccurrences,
      totalCriticalOccurrences,
      totalAlerts,
      occurrencesByPriority: occurrencesByPriority.map((g) => ({ priority: g.priority, count: g._count })),
      occurrencesByStatus: occurrencesByStatus.map((g) => ({ status: g.status, count: g._count })),
    };
  }

  async getKpis(condominiumId?: string) {
    const condFilter = condominiumId ? { condominiumId } : {};

    const [
      totalConversations,
      afterHoursConversations,
      recentOccurrences,
      recentAlerts,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: condFilter }),
      this.prisma.auditLog.count({
        where: {
          action: 'WEBHOOK_RECEIVED',
          metadata: { path: ['isAfterHours'], equals: true },
          ...condFilter,
        },
      }),
      this.prisma.occurrence.findMany({
        where: condFilter,
        orderBy: { openedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, status: true, priority: true, openedAt: true },
      }),
      this.prisma.alert.findMany({
        where: condFilter,
        orderBy: { triggeredAt: 'desc' },
        take: 10,
        select: { id: true, triggerType: true, urgencyLevel: true, status: true, triggeredAt: true },
      }),
    ]);

    return {
      totalConversations,
      afterHoursConversations,
      recentOccurrences,
      recentAlerts,
    };
  }
}
