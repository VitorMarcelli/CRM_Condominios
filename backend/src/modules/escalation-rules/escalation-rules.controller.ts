import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscalationRulesService } from './escalation-rules.service';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Escalation Rules')
@Controller('escalation-rules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class EscalationRulesController {
  constructor(private service: EscalationRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List escalation rules' })
  findAll(@CurrentUser() user: any, @Query('condominiumId') queryCondominiumId?: string) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll(condominiumId);
  }

  @Post()
  @ApiOperation({ summary: 'Create escalation rule' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : dto.condominiumId;
    return this.service.create({ ...dto, condominiumId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escalation rule' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update escalation rule' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }
}
