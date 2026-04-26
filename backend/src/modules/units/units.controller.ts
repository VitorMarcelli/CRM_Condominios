import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { RolesGuard } from '../../common/guards';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateUnitDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ example: '1' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  condominiumId: string;
}

@ApiTags('Units')
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UnitsController {
  constructor(private service: UnitsService) {}

  @Get('blocks/:blockId/units')
  @ApiOperation({ summary: 'List units by block' })
  findByBlock(@Param('blockId') blockId: string) {
    return this.service.findByBlock(blockId);
  }

  @Post('blocks/:blockId/units')
  @ApiOperation({ summary: 'Create unit in block' })
  create(@Param('blockId') blockId: string, @Body() dto: CreateUnitDto) {
    return this.service.create(blockId, dto);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update unit' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateUnitDto>) {
    return this.service.update(id, dto);
  }
}
