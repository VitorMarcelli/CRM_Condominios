import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { RolesGuard } from '../../common/guards';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateBlockDto {
  @ApiProperty({ example: 'Bloco A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  code?: string;
}

@ApiTags('Blocks')
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class BlocksController {
  constructor(private service: BlocksService) {}

  @Get('condominiums/:condominiumId/blocks')
  @ApiOperation({ summary: 'List blocks by condominium' })
  findByCondominium(@Param('condominiumId') condominiumId: string) {
    return this.service.findByCondominium(condominiumId);
  }

  @Post('condominiums/:condominiumId/blocks')
  @ApiOperation({ summary: 'Create block in condominium' })
  create(@Param('condominiumId') condominiumId: string, @Body() dto: CreateBlockDto) {
    return this.service.create(condominiumId, dto);
  }

  @Get('blocks/:id')
  @ApiOperation({ summary: 'Get block by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put('blocks/:id')
  @ApiOperation({ summary: 'Update block' })
  update(@Param('id') id: string, @Body() dto: CreateBlockDto) {
    return this.service.update(id, dto);
  }
}
