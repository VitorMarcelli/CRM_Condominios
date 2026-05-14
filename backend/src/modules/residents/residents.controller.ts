import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResidentsService } from './residents.service';
import { PermissionsGuard } from '../../common/guards';
import { CurrentUser, RequirePermission } from '../../common/decorators';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateResidentDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() condominiumId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() unitId?: string;
  @ApiProperty({ example: 'João Silva' }) @IsString() @IsNotEmpty() fullName: string;
  @ApiPropertyOptional({ example: '21999990000' }) @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional({ example: 'joao@email.com' }) @IsString() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() document?: string;
}

@ApiTags('Residents')
@Controller('residents')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class ResidentsController {
  constructor(private service: ResidentsService) {}

  @Post()
  @RequirePermission('residents', 'create')
  @ApiOperation({ summary: 'Create resident' })
  create(@Body() dto: CreateResidentDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission('residents', 'view')
  @ApiOperation({ summary: 'List residents' })
  findAll(
    @CurrentUser() user: any,
    @Query('condominiumId') condominiumId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({
      condominiumId,
      userRole: user.role,
      userCondominiumId: user.condominiumId,
      page,
      limit,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search residents by name, phone, or unit' })
  search(
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('unit') unit?: string,
    @Query('condominiumId') condominiumId?: string,
  ) {
    return this.service.search({ name, phone, unit, condominiumId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resident by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermission('residents', 'edit')
  @ApiOperation({ summary: 'Update resident' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateResidentDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('residents', 'delete')
  @ApiOperation({ summary: 'Delete resident' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
