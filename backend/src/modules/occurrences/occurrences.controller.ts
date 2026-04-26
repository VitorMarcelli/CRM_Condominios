import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OccurrencesService } from './occurrences.service';
import { RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateOccurrenceDto {
  @ApiProperty() @IsUUID() condominiumId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() residentId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() conversationId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() categoryId?: string;
  @ApiProperty({ example: 'Portão travado' }) @IsString() @IsNotEmpty() title: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] }) @IsString() @IsOptional() priority?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() assignedUserId?: string;
}

class UpdateStatusDto {
  @ApiProperty({ enum: ['new', 'in_progress', 'waiting_resident', 'waiting_internal', 'resolved', 'closed', 'reopened'] })
  @IsString()
  @IsIn(['new', 'in_progress', 'waiting_resident', 'waiting_internal', 'resolved', 'closed', 'reopened'])
  status: string;
}

class UpdatePriorityDto {
  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority: string;
}

class AssignDto {
  @ApiProperty() @IsUUID() assignedUserId: string;
}

@ApiTags('Occurrences')
@Controller('occurrences')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OccurrencesController {
  constructor(private service: OccurrencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create occurrence' })
  create(@Body() dto: CreateOccurrenceDto, @CurrentUser() user: any) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : dto.condominiumId;
    return this.service.create({ ...dto, condominiumId }, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List occurrences' })
  findAll(
    @CurrentUser() user: any,
    @Query('condominiumId') queryCondominiumId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll({ condominiumId, status, priority, assignedUserId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get occurrence detail' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update occurrence' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateOccurrenceDto>, @CurrentUser('sub') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update occurrence status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser('sub') userId: string) {
    return this.service.updateStatus(id, dto.status, userId);
  }

  @Patch(':id/priority')
  @ApiOperation({ summary: 'Update occurrence priority' })
  updatePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto, @CurrentUser('sub') userId: string) {
    return this.service.updatePriority(id, dto.priority, userId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign occurrence to user' })
  assign(@Param('id') id: string, @Body() dto: AssignDto, @CurrentUser('sub') userId: string) {
    return this.service.assign(id, dto.assignedUserId, userId);
  }
}
