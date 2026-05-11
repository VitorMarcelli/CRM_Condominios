import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomRolesService } from './custom-roles.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateCustomRoleDto {
  @ApiProperty({ example: 'Porteiro Noturno' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsString() @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Granular permissions per module' })
  @IsObject()
  permissions: Record<string, Record<string, boolean>>;
}

class UpdateCustomRoleDto {
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsObject() @IsOptional()
  permissions?: Record<string, Record<string, boolean>>;
}

@ApiTags('Custom Roles')
@Controller('custom-roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CustomRolesController {
  constructor(private service: CustomRolesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create custom role' })
  create(@Body() dto: CreateCustomRoleDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  findAll() {
    return this.service.findAll();
  }

  @Get('template')
  @ApiOperation({ summary: 'Get permissions template' })
  getTemplate() {
    return this.service.getPermissionsTemplate();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomRoleDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete custom role' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}
