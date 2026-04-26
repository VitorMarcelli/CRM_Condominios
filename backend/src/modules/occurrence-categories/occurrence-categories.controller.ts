import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OccurrenceCategoriesService } from './occurrence-categories.service';
import { RolesGuard } from '../../common/guards';

@ApiTags('Occurrence Categories')
@Controller('occurrence-categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OccurrenceCategoriesController {
  constructor(private service: OccurrenceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List occurrence categories' })
  findAll(@Query('condominiumId') condominiumId?: string) {
    return this.service.findAll(condominiumId);
  }

  @Post()
  @ApiOperation({ summary: 'Create occurrence category' })
  create(@Body() dto: { condominiumId?: string; name: string; severityDefault?: string; isEmergency?: boolean }) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update occurrence category' })
  update(@Param('id') id: string, @Body() dto: { name?: string; severityDefault?: string; isEmergency?: boolean }) {
    return this.service.update(id, dto);
  }
}
