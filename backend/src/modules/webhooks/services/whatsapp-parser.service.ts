import { Injectable, BadRequestException } from '@nestjs/common';
import { PhoneNormalizationUtil } from '../../../common/utils/phone-normalization.util';

export interface ParsedWhatsAppMessage {
  provider: 'whatsapp_cloud_mock';
  externalMessageId: string;
  senderPhone: string;
  senderName?: string;
  body?: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'unknown';
  timestamp: Date;
  rawPayload: any;
}

@Injectable()
export class WhatsAppPayloadParser {
  
  parseMockPayload(payload: any): ParsedWhatsAppMessage[] {
    try {
      if (payload.object !== 'whatsapp_business_account' || !payload.entry || !payload.entry[0].changes) {
        throw new Error('Invalid WhatsApp Cloud API structure');
      }

      const value = payload.entry[0].changes[0].value;
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      return messages.map((msg: any) => {
        const contact = contacts.find((c: any) => c.wa_id === msg.from);
        
        return {
          provider: 'whatsapp_cloud_mock',
          externalMessageId: msg.id,
          senderPhone: PhoneNormalizationUtil.normalize(msg.from),
          senderName: contact?.profile?.name,
          body: msg.type === 'text' ? msg.text?.body : undefined,
          messageType: msg.type || 'unknown',
          timestamp: new Date(parseInt(msg.timestamp) * 1000),
          rawPayload: payload,
        };
      });
    } catch (error) {
      throw new BadRequestException('Failed to parse WhatsApp payload');
    }
  }
}
