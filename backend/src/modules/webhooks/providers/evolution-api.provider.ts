import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { tenantContext } from '../../../common/context/tenant-context';

export interface EvolutionSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EvolutionApiProvider {
  private readonly logger = new Logger(EvolutionApiProvider.name);
  private readonly http: AxiosInstance;
  private readonly instance: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const baseURL = this.config.get<string>('EVOLUTION_API_URL', 'http://localhost:8080');
    const apiKey = this.config.get<string>('EVOLUTION_API_KEY', '');
    this.instance = this.config.get<string>('EVOLUTION_INSTANCE', 'crm-condominios');

    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      timeout: 15000,
    });
  }

  private async resolveInstanceName(instanceName?: string): Promise<string> {
    if (instanceName) return instanceName;
    const ctx = tenantContext.getStore();
    if (ctx?.organizationId) {
      const orgSettings = await this.prisma.organizationSettings.findUnique({
        where: { organizationId: ctx.organizationId },
        select: { whatsappInstanceId: true },
      });
      if (orgSettings?.whatsappInstanceId) return orgSettings.whatsappInstanceId;
    }
    return this.instance;
  }

  async sendText(to: string, body: string, instanceName?: string): Promise<EvolutionSendResult> {
    try {
      const phone = this.normalizePhone(to);
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.post(`/message/sendText/${name}`, {
        number: phone,
        text: body,
      });

      return {
        success: true,
        messageId: res.data?.key?.id || res.data?.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send text to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendMedia(to: string, mediaUrl: string, caption?: string, instanceName?: string): Promise<EvolutionSendResult> {
    try {
      const phone = this.normalizePhone(to);
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.post(`/message/sendMedia/${name}`, {
        number: phone,
        mediatype: 'image',
        media: mediaUrl,
        caption: caption || '',
      });

      return {
        success: true,
        messageId: res.data?.key?.id || res.data?.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send media to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse incoming webhook payload from Evolution API.
   * Evolution API sends payloads with event type "messages.upsert".
   */
  parseIncomingWebhook(payload: any): {
    phone: string;
    name: string;
    body: string;
    messageId: string;
    timestamp: Date;
    fromMe: boolean;
    mediaUrl?: string;
    messageType: string;
    instanceName?: string;
  } | null {
    try {
      // Evolution API v2 format
      if (payload?.event === 'messages.upsert' && payload?.data) {
        const data = payload.data;
        const key = data.key;

        if (!key || key.fromMe) return null; // Ignore our own messages

        const remoteJid = key.remoteJid || '';
        const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

        const message = data.message || {};
        const body =
          message.conversation ||
          message.extendedTextMessage?.text ||
          message.imageMessage?.caption ||
          message.videoMessage?.caption ||
          '';

        const messageType = message.conversation || message.extendedTextMessage
          ? 'text'
          : message.imageMessage
            ? 'image'
            : message.videoMessage
              ? 'video'
              : message.audioMessage
                ? 'audio'
                : message.documentMessage
                  ? 'document'
                  : 'unknown';

        return {
          phone: this.normalizePhone(phone),
          name: data.pushName || 'Desconhecido',
          body,
          messageId: key.id,
          timestamp: new Date((data.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000),
          fromMe: false,
          messageType,
          instanceName: payload?.instance || undefined, // Evolution usually sends the instance name
        };
      }

      return null;
    } catch (error: any) {
      this.logger.warn(`Failed to parse Evolution webhook: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a new instance in Evolution API (used during setup).
   */
  async createInstance(instanceName?: string): Promise<any> {
    try {
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.post('/instance/create', {
        instanceName: name,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      });
      this.logger.log(`Instance "${name}" created successfully`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Failed to create instance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get QR code for connecting WhatsApp instance.
   */
  async getQrCode(instanceName?: string): Promise<any> {
    try {
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.get(`/instance/connect/${name}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Failed to get QR code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configure webhook for an instance to point back to our CRM.
   */
  async setWebhook(webhookUrl: string, instanceName?: string): Promise<any> {
    try {
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.post(`/webhook/set/${name}`, {
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          events: ['MESSAGES_UPSERT'],
        },
      });
      this.logger.log(`Webhook set for instance "${name}" → ${webhookUrl}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check instance connection status.
   */
  async getConnectionStatus(instanceName?: string): Promise<any> {
    try {
      const name = await this.resolveInstanceName(instanceName);
      const res = await this.http.get(`/instance/connectionState/${name}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`Failed to check connection: ${error.message}`);
      return { state: 'error', error: error.message };
    }
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  }
}
