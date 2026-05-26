import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InternalUsersService } from './internal-users.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, MinLength, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateInternalUserDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() condominiumId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() customRoleId?: string;
  @ApiProperty({ example: 'Maria Santos' }) @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty({ example: 'maria@email.com' }) @IsEmail() email: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiPropertyOptional({ description: 'Granular permissions object' })
  @IsObject() @IsOptional() permissions?: Record<string, boolean>;
}

class UpdateInternalUserDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() condominiumId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() customRoleId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fullName?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional({ enum: Role }) @IsEnum(Role) @IsOptional() role?: string;
  @ApiPropertyOptional({ description: 'Granular permissions object' })
  @IsObject() @IsOptional() permissions?: Record<string, boolean>;
}

class UpdateStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsString()
  status: string;
}

@ApiTags('Internal Users')
@Controller('internal-users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InternalUsersController {
  constructor(private service: InternalUsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create internal user' })
  create(@Body() dto: CreateInternalUserDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List internal users' })
  findAll(@Query('condominiumId') condominiumId?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll({ condominiumId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get internal user by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update internal user' })
  update(@Param('id') id: string, @Body() dto: UpdateInternalUserDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update user status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser('sub') userId: string) {
    return this.service.updateStatus(id, dto.status, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete internal user' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}
