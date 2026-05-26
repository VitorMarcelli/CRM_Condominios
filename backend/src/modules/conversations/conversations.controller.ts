import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';
import { PermissionsGuard } from '../../common/guards';
import { CurrentUser, RequirePermission, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
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
  constructor(
    private service: ConversationsService,
    private evolution: EvolutionApiProvider,
  ) {}

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
  @ApiOperation({ summary: 'Send message in conversation (sends via WhatsApp if outbound)' })
  async addMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    // Save message to database
    const message = await this.service.addMessage(id, dto);

    // If outbound, send via WhatsApp (Evolution API)
    if (dto.direction === 'outbound' && dto.body) {
      const conversation = await this.service.findOne(id);
      const phone = conversation.externalReference || conversation.resident?.phone;

      if (phone) {
        const result = await this.evolution.sendText(phone, dto.body);
        if (!result.success) {
          // Message saved in DB but failed to send via WhatsApp
          // We still return the message but add a warning
          return { ...message, whatsappDelivery: 'failed', error: result.error };
        }
        return { ...message, whatsappDelivery: 'sent', whatsappMessageId: result.messageId };
      }
    }

    return message;
  }

  @Post(':id/take-over')
  @RequirePermission('conversations', 'respond')
  @ApiOperation({ summary: 'Assumir a conversa (bloquear a IA)' })
  async takeOver(@Param('id') id: string, @CurrentUser() user: any) {
    const updated = await this.service.takeOver(id, user.sub);
    const convInfo = await this.service.findOne(id);
    const phone = convInfo.externalReference || convInfo.resident?.phone;
    
    if (phone) {
      await this.evolution.sendText(phone, `Atendimento assumido por ${updated.assignedTo?.fullName || 'um operador'}.`);
    }
    return updated;
  }

  @Post(':id/resume-ai')
  @RequirePermission('conversations', 'respond')
  @ApiOperation({ summary: 'Devolver a conversa para a IA' })
  async resumeAi(@Param('id') id: string) {
    const updated = await this.service.resumeAi(id);
    const convInfo = await this.service.findOne(id);
    const phone = convInfo.externalReference || convInfo.resident?.phone;
    
    if (phone) {
      await this.evolution.sendText(phone, `Atendimento devolvido para o Assistente de IA.`);
    }
    return updated;
  }

  @Post(':id/close')
  @RequirePermission('conversations', 'respond')
  @ApiOperation({ summary: 'Encerrar o atendimento' })
  async closeConversation(@Param('id') id: string, @CurrentUser() user: any) {
    const updated = await this.service.closeConversation(id, user.sub);
    const convInfo = await this.service.findOne(id);
    const phone = convInfo.externalReference || convInfo.resident?.phone;
    
    if (phone) {
      await this.evolution.sendText(phone, `Atendimento encerrado por ${updated.operatorName}.`);
    }
    return updated;
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Zerar contador de mensagens não lidas' })
  async markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SINDICO, Role.ATENDENTE)
  @ApiOperation({ summary: 'Deletar conversa' })
  async deleteConversation(@Param('id') id: string) {
    return this.service.deleteConversation(id);
  }
}
