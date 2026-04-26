// WhatsApp Provider Interface — Abstraction layer for future provider swap
// Currently using WhatsApp Cloud API format as mock reference

export interface WhatsAppIncomingMessage {
  from: string;          // phone number
  name?: string;         // sender name
  body?: string;         // text body
  type: string;          // text, image, video, audio, document
  mediaUrl?: string;
  timestamp: string;
  messageId: string;
}

export interface WhatsAppProvider {
  sendMessage(to: string, body: string): Promise<{ success: boolean; messageId?: string }>;
  sendMedia(to: string, mediaUrl: string, caption?: string): Promise<{ success: boolean; messageId?: string }>;
  parseIncomingPayload(payload: any): WhatsAppIncomingMessage | null;
}

// Mock implementation for MVP
export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, body: string) {
    console.log(`[MOCK WhatsApp] Sending to ${to}: ${body}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  async sendMedia(to: string, mediaUrl: string, caption?: string) {
    console.log(`[MOCK WhatsApp] Sending media to ${to}: ${mediaUrl}`);
    return { success: true, messageId: `mock_media_${Date.now()}` };
  }

  parseIncomingPayload(payload: any): WhatsAppIncomingMessage | null {
    try {
      // WhatsApp Cloud API format
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (!message) return null;

      return {
        from: message.from,
        name: contact?.profile?.name,
        body: message.text?.body || message.caption || '',
        type: message.type || 'text',
        mediaUrl: message.image?.link || message.video?.link || message.document?.link,
        timestamp: message.timestamp,
        messageId: message.id,
      };
    } catch {
      // Fallback for simplified test payloads
      if (payload?.from && payload?.body) {
        return {
          from: payload.from,
          name: payload.name || 'Unknown',
          body: payload.body,
          type: 'text',
          timestamp: String(Math.floor(Date.now() / 1000)),
          messageId: `simple_${Date.now()}`,
        };
      }
      return null;
    }
  }
}
