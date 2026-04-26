import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BusinessHoursService } from './business-hours.service';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Business Hours')
@Controller('business-hours')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class BusinessHoursController {
  constructor(private service: BusinessHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Get business hours for a condominium' })
  findAll(@Query('condominiumId') condominiumId: string) {
    return this.service.findByCondominium(condominiumId);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update business hour' })
  update(@Param('id') id: string, @Body() dto: { startTime?: string; endTime?: string; isActive?: boolean }) {
    return this.service.update(id, dto);
  }
}
