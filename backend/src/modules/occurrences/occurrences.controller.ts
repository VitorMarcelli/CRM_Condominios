import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OccurrencesService } from './occurrences.service';
import { PermissionsGuard } from '../../common/guards';
import { CurrentUser, RequirePermission } from '../../common/decorators';
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

class AddTimelineDto {
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiPropertyOptional() @IsOptional() isInternal?: boolean;
}

@ApiTags('Occurrences')
@Controller('occurrences')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class OccurrencesController {
  constructor(private service: OccurrencesService) {}

  @Post()
  @RequirePermission('occurrences', 'create')
  @ApiOperation({ summary: 'Create occurrence' })
  create(@Body() dto: CreateOccurrenceDto, @CurrentUser() user: any) {
    const condominiumId = user.role !== 'SUPER_ADMIN' ? user.condominiumId : dto.condominiumId;
    return this.service.create({ ...dto, condominiumId }, user.sub);
  }

  @Get()
  @RequirePermission('occurrences', 'view')
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
    const condominiumId = user.role !== 'SUPER_ADMIN' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll({ condominiumId, status, priority, assignedUserId, page, limit });
  }

  @Get(':id')
  @RequirePermission('occurrences', 'view')
  @ApiOperation({ summary: 'Get occurrence detail' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Post(':id/timeline')
  @ApiOperation({ summary: 'Add note to timeline' })
  addTimelineEntry(@Param('id') id: string, @Body() dto: AddTimelineDto, @CurrentUser() user: any) {
    return this.service.addTimelineEntry(id, dto, user);
  }

  @Put(':id')
  @RequirePermission('occurrences', 'edit')
  @ApiOperation({ summary: 'Update occurrence' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateOccurrenceDto>, @CurrentUser() user: any) {
    return this.service.update(id, dto, user.sub, user);
  }

  @Patch(':id/status')
  @RequirePermission('occurrences', 'resolve')
  @ApiOperation({ summary: 'Update occurrence status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.service.updateStatus(id, dto.status, user.sub, user);
  }

  @Patch(':id/priority')
  @ApiOperation({ summary: 'Update occurrence priority' })
  updatePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto, @CurrentUser() user: any) {
    return this.service.updatePriority(id, dto.priority, user.sub, user);
  }

  @Patch(':id/assign')
  @RequirePermission('occurrences', 'assign')
  @ApiOperation({ summary: 'Assign occurrence to user' })
  assign(@Param('id') id: string, @Body() dto: AssignDto, @CurrentUser() user: any) {
    return this.service.assign(id, dto.assignedUserId, user.sub, user);
  }

  @Delete(':id')
  @RequirePermission('occurrences', 'delete')
  @ApiOperation({ summary: 'Delete occurrence' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
