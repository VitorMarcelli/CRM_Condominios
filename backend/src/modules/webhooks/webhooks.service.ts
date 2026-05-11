import { Injectable, Logger } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { ResidentsService } from '../residents/residents.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { AuditService } from '../audit/audit.service';
import { EvolutionApiProvider } from './providers/evolution-api.provider';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private conversations: ConversationsService,
    private residents: ResidentsService,
    private aiAgent: AiAgentService,
    private audit: AuditService,
    private evolution: EvolutionApiProvider,
  ) {}

  async handleEvolutionWebhook(payload: any, headerCondominiumId?: string) {
    this.logger.log(`Webhook received: event=${payload?.event}`);

    // 1. Parse incoming payload from Evolution API
    const parsed = this.evolution.parseIncomingWebhook(payload);
    if (!parsed) {
      this.logger.log('Webhook ignored (not a user message or unparseable)');
      return { status: 'ignored', reason: 'not_a_user_message' };
    }

    const { phone, name, body, messageId, messageType } = parsed;

    // 2. Skip non-text messages for now (images, audio, etc.)
    if (messageType !== 'text' || !body || body.trim().length === 0) {
      this.logger.log(`Non-text or empty message from ${phone}, type: ${messageType}`);
      // Send a polite message asking for text
      if (messageType !== 'text' && messageType !== 'unknown') {
        await this.evolution.sendText(
          phone,
          'Recebi seu arquivo! 📎 No momento, consigo processar apenas mensagens de texto. Por favor, descreva sua solicitação por escrito.',
        );
      }
      return { status: 'ignored', reason: 'non_text_message' };
    }

    // 3. Identify resident by phone
    const resident = await this.residents.findByPhone(phone);
    const condominiumId = resident?.condominiumId || headerCondominiumId;

    if (!condominiumId) {
      this.logger.warn(`Unknown phone ${phone} and no condominium context`);
      await this.evolution.sendText(
        phone,
        'Olá! Não consegui identificar seu número em nosso sistema. Por favor, entre em contato com a administração do seu condomínio para realizar o cadastro.',
      );
      return { status: 'ignored', reason: 'unknown_condominium' };
    }

    // 4. Check idempotency
    if (messageId) {
      const existing = await this.conversations.findMessageByExternalId(messageId);
      if (existing) {
        this.logger.log(`Duplicate message ${messageId} skipped`);
        return { status: 'ignored', reason: 'duplicate' };
      }
    }

    // 5. Create or find conversation
    const conversation = await this.conversations.createOrFindConversation(
      condominiumId,
      phone,
      resident?.id,
    );

    // 6. Register inbound message
    await this.conversations.addMessage(conversation.id, {
      direction: 'inbound',
      senderName: name,
      senderPhone: phone,
      body,
      externalId: messageId,
      rawPayload: payload,
    });

    // 7. Process with AI Agent
    const aiResult = await this.aiAgent.processMessage({
      condominiumId,
      conversationId: conversation.id,
      residentId: resident?.id,
      residentName: resident?.fullName,
      phone,
      senderName: name,
      messageBody: body,
      isRegistered: !!resident,
    });

    // 8. Save AI response as outbound message
    await this.conversations.addMessage(conversation.id, {
      direction: 'system',
      body: aiResult.responseMessage,
      rawPayload: { generatedBy: 'AiAgentService', action: aiResult.action },
    });

    // 9. Audit log
    await this.audit.log({
      condominiumId,
      entityType: 'Conversation',
      entityId: conversation.id,
      action: 'AI_AGENT_RESPONSE',
      actorType: 'system',
      metadata: {
        phone,
        aiAction: aiResult.action,
        occurrenceId: aiResult.occurrenceId,
        alertId: aiResult.alertId,
      },
    });

    return {
      status: 'processed',
      conversationId: conversation.id,
      residentFound: !!resident,
      aiAction: aiResult.action,
      occurrenceCreated: !!aiResult.occurrenceId,
    };
  }
}
