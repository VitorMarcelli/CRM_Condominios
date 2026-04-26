import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get operational metrics for the dashboard' })
  async getMetrics(
    @CurrentUser() user: any,
    @Query('condominiumId') queryCondominiumId?: string,
  ) {
    const condominiumId = user.role !== 'SUPER_ADMIN' ? user.condominiumId : queryCondominiumId;
    const whereCondo = condominiumId ? { condominiumId } : {};

    const [
      totalResidents,
      totalOpenOccurrences,
      totalCriticalOccurrences,
      totalActiveAlerts,
      totalOpenConversations,
      occurrencesByStatus,
      occurrencesByPriority,
      alertsByStatus
    ] = await Promise.all([
      this.prisma.resident.count({ where: { ...whereCondo, status: 'active' } }),
      this.prisma.occurrence.count({ where: { ...whereCondo, status: { in: ['new', 'in_progress', 'waiting_resident', 'waiting_internal'] } } }),
      this.prisma.occurrence.count({ where: { ...whereCondo, priority: 'critical', status: { not: 'closed' } } }),
      this.prisma.alert.count({ where: { ...whereCondo, status: 'triggered' } }),
      this.prisma.conversation.count({ where: { ...whereCondo, status: 'open' } }),
      this.prisma.occurrence.groupBy({ by: ['status'], _count: true, where: whereCondo }),
      this.prisma.occurrence.groupBy({ by: ['priority'], _count: true, where: whereCondo }),
      this.prisma.alert.groupBy({ by: ['status'], _count: true, where: whereCondo })
    ]);

    // Also get recent occurrences
    const recentOccurrences = await this.prisma.occurrence.findMany({
      where: whereCondo,
      orderBy: { openedAt: 'desc' },
      take: 5,
      include: { category: { select: { name: true } }, resident: { select: { fullName: true } } }
    });

    // Recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      where: whereCondo,
      orderBy: { triggeredAt: 'desc' },
      take: 5,
      include: { occurrence: { select: { title: true } } }
    });

    return {
      totalResidents,
      totalOpenOccurrences,
      totalCriticalOccurrences,
      totalActiveAlerts,
      totalOpenConversations,
      occurrencesByStatus: occurrencesByStatus.map(o => ({ status: o.status, count: o._count })),
      occurrencesByPriority: occurrencesByPriority.map(o => ({ priority: o.priority, count: o._count })),
      alertsByStatus: alertsByStatus.map(a => ({ status: a.status, count: a._count })),
      recentOccurrences,
      recentAlerts
    };
  }
}
