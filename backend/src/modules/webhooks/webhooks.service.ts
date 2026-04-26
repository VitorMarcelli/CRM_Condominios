import { Injectable, Logger } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { ResidentsService } from '../residents/residents.service';
import { AfterHoursTriageService } from './after-hours-triage.service';
import { AuditService } from '../audit/audit.service';
import { WhatsAppPayloadParser } from './services/whatsapp-parser.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private conversations: ConversationsService,
    private residents: ResidentsService,
    private triage: AfterHoursTriageService,
    private audit: AuditService,
    private parser: WhatsAppPayloadParser,
  ) {}

  async handleWhatsAppWebhook(payload: any, headerCondominiumId?: string) {
    this.logger.log('WhatsApp webhook received');

    // 1. Parse incoming payload
    let messages;
    try {
      messages = this.parser.parseMockPayload(payload);
    } catch (err) {
      this.logger.warn('Could not parse WhatsApp payload');
      return { status: 'ignored', reason: 'unparseable_payload' };
    }

    const results: any[] = [];

    for (const message of messages) {
      // 2. Try to identify resident by phone
      const resident = await this.residents.findByPhone(message.senderPhone);
      
      // Condominium resolution: 
      // First try to use the resident's condominium. If no resident is found, use the header (webhook configuration scope).
      const condominiumId = resident?.condominiumId || headerCondominiumId;

      if (!condominiumId) {
        this.logger.warn(`Unknown sender: ${message.senderPhone} and no x-condominium-id header provided.`);
        results.push({ status: 'ignored', reason: 'unknown_condominium', phone: message.senderPhone });
        continue;
      }

      // Check idempotency
      const messageId = message.externalId || message.id || String(Date.now()); // Ensure unique ID per provider payload
      if (message.externalId) {
        const existing = await this.conversations.findMessageByExternalId(message.externalId);
        if (existing) {
          this.logger.log(`Duplicate message ${message.externalId} skipped.`);
          results.push({ status: 'ignored', reason: 'duplicate_message', externalId: message.externalId });
          continue;
        }
      }

      // 3. Create or find conversation
      const conversation = await this.conversations.createOrFindConversation(
        condominiumId,
        message.senderPhone,
        resident?.id,
      );

      // 4. Register inbound message
      await this.conversations.addMessage(conversation.id, {
        direction: 'inbound',
        senderName: message.senderName,
        senderPhone: message.senderPhone,
        body: message.body,
        mediaUrl: message.mediaUrl,
        externalId: message.externalId,
        rawPayload: payload,
      });

      // 5. Run triage (checks business hours, urgency, etc.)
      const triageResult = await this.triage.processMessage({
        condominiumId,
        conversationId: conversation.id,
        residentId: resident?.id,
        messageBody: message.body || '',
        senderPhone: message.senderPhone,
      });

      // 6. If triage triggers an auto-response, save it as a system outbound message
      if (triageResult.autoResponse) {
        await this.conversations.addMessage(conversation.id, {
          direction: 'system',
          body: triageResult.autoResponse,
          rawPayload: { generatedBy: 'AfterHoursTriageService' },
        });
      }

      // 7. Log audit
      await this.audit.log({
        condominiumId,
        entityType: 'Conversation',
        entityId: conversation.id,
        action: 'WEBHOOK_RECEIVED',
        actorType: 'system',
        metadata: {
          phone: message.senderPhone,
          triageResult: triageResult.action,
          isAfterHours: triageResult.isAfterHours,
        },
      });

      results.push({
        success: true,
        conversationId: conversation.id,
        residentFound: !!resident,
        afterHours: triageResult.isAfterHours,
        occurrenceCreated: !!triageResult.occurrenceId,
        alertTriggered: !!triageResult.alertId,
      });
    }

    return { status: 'processed', results };
  }
}
