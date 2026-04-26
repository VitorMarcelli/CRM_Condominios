import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CondominiumsService } from './condominiums.service';
import { CreateCondominiumDto } from './dto/create-condominium.dto';
import { UpdateCondominiumDto } from './dto/update-condominium.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';

@ApiTags('Condominiums')
@Controller('condominiums')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CondominiumsController {
  constructor(private service: CondominiumsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new condominium' })
  create(@Body() dto: CreateCondominiumDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all condominiums' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get condominium by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update condominium' })
  update(@Param('id') id: string, @Body() dto: UpdateCondominiumDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update condominium status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser('sub') userId: string) {
    return this.service.updateStatus(id, dto.status, userId);
  }
}
