import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayablesService } from './payables.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';

@ApiTags('Payables')
@Controller('payables')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PayablesController {
  constructor(private readonly service: PayablesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Create a payable' })
  create(@Body() dto: any, @CurrentUser('condominiumId') condoId: string) {
    if (!dto.condominiumId) dto.condominiumId = condoId;
    return this.service.create(dto);
  }

  @Get('metrics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Get financial metrics' })
  getMetrics(@Query('condominiumId') queryCondoId?: string, @CurrentUser('condominiumId') userCondoId?: string) {
    const condominiumId = queryCondoId || userCondoId;
    return this.service.getMetrics(condominiumId);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'List payables' })
  findAll(@Query('condominiumId') queryCondoId?: string, @CurrentUser('condominiumId') userCondoId?: string) {
    const condominiumId = queryCondoId || userCondoId;
    return this.service.findAll(condominiumId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Get payable by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Update a payable' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Delete a payable' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/pay')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO)
  @ApiOperation({ summary: 'Mark payable as paid' })
  pay(@Param('id') id: string, @Body() dto: any) {
    return this.service.pay(id, dto);
  }
}
