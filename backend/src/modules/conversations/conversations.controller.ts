import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { PermissionsGuard } from '../../common/guards';
import { CurrentUser, RequirePermission } from '../../common/decorators';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateMessageDto {
  @ApiProperty({ enum: ['inbound', 'outbound'] }) @IsString() direction: string;
  @ApiPropertyOptional() @IsString() @IsOptional() senderName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() senderPhone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() body?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() mediaUrl?: string;
}

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  @Get()
  @RequirePermission('conversations', 'view')
  @ApiOperation({ summary: 'List conversations' })
  findAll(
    @CurrentUser() user: any,
    @Query('condominiumId') queryCondominiumId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const condominiumId = user.role !== 'SUPER_ADMIN' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll({ condominiumId, status, page, limit });
  }

  @Get(':id')
  @RequirePermission('conversations', 'view')
  @ApiOperation({ summary: 'Get conversation with messages' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages of a conversation' })
  getMessages(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getMessages(id, { page, limit });
  }

  @Post(':id/messages')
  @RequirePermission('conversations', 'respond')
  @ApiOperation({ summary: 'Send message in conversation' })
  addMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.service.addMessage(id, dto);
  }
}
