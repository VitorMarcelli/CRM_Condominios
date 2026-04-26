import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private service: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List alerts' })
  findAll(
    @CurrentUser() user: any,
    @Query('condominiumId') queryCondominiumId?: string,
    @Query('status') status?: string,
    @Query('urgencyLevel') urgencyLevel?: string,
    @Query('occurrenceId') occurrenceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const condominiumId = user.role !== 'SUPER_ADMIN' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll({ condominiumId, status, urgencyLevel, occurrenceId, startDate, endDate, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert detail' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger alert for an occurrence' })
  trigger(
    @Body() dto: { condominiumId: string; occurrenceId: string; triggerType: string; urgencyLevel: string },
    @CurrentUser() user: any,
  ) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : dto.condominiumId;
    return this.service.trigger({ ...dto, condominiumId }, user.sub);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  acknowledge(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.acknowledge(id, userId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close alert' })
  close(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.close(id, userId);
  }
}
