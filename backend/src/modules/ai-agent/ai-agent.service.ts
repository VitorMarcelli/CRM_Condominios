import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService, GeminiResponse } from './gemini.service';
import { ChatMemoryService } from './chat-memory.service';
import { NotifierService } from './notifier.service';
import { OccurrencesService } from '../occurrences/occurrences.service';
import { AlertsService } from '../alerts/alerts.service';
import { ConversationsService } from '../conversations/conversations.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';
import { Content } from '@google/generative-ai';

export interface AiAgentInput {
  condominiumId: string;
  conversationId: string;
  residentId?: string;
  residentName?: string;
  phone: string;
  senderName: string;
  messageBody: string;
  isRegistered: boolean;
}

export interface AiAgentResult {
  responseMessage: string;
  action: 'chat' | 'ticket_created' | 'unregistered_notified' | 'handoff' | 'fallback';
  occurrenceId?: string;
  alertId?: string;
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
    private memory: ChatMemoryService,
    private notifier: NotifierService,
    private occurrences: OccurrencesService,
    private alerts: AlertsService,
    private conversations: ConversationsService,
    private evolution: EvolutionApiProvider,
  ) {}

  async processMessage(input: AiAgentInput): Promise<AiAgentResult> {
    const { condominiumId, conversationId, residentId, phone, senderName, messageBody, isRegistered } = input;

    // 1. Get condominium name for context
    const condo = await this.prisma.condominium.findUnique({
      where: { id: condominiumId },
      select: { name: true },
    });
    const condoName = condo?.name || 'Condomínio';

    // 2. If not registered, handle specially
    if (!isRegistered) {
      return this.handleUnregistered(condominiumId, phone, senderName, messageBody, condoName);
    }

    // 3. Load conversation memory/context
    const residentContext = await this.memory.getContextForPrompt(condominiumId, phone);

    // 4. Check for open tickets from this resident
    let openTicketWarning = '';
    if (residentId) {
      const openTickets = await this.prisma.occurrence.findMany({
        where: {
          residentId,
          status: { notIn: ['resolved', 'closed'] },
        },
        orderBy: { openedAt: 'desc' },
        take: 1,
        select: { id: true, title: true, status: true },
      });

      if (openTickets.length > 0) {
        openTicketWarning = `\n\n[SISTEMA: Este morador tem um chamado aberto: "${openTickets[0].title}" (status: ${openTickets[0].status}). Pergunte se esse chamado foi resolvido antes de abrir um novo.]`;
      }
    }

    // 5. Build conversation history from database
    const conversationHistory = await this.buildConversationHistory(conversationId);

    // 6. Send to Gemini
    const fullMessage = messageBody + openTicketWarning;
    const geminiResponse = await this.gemini.chat(condoName, conversationHistory, fullMessage, residentContext);

    // 7. Process response based on type
    return this.processGeminiResponse(geminiResponse, {
      condominiumId,
      conversationId,
      residentId,
      phone,
      senderName: input.residentName || senderName,
    });
  }

  private async handleUnregistered(
    condominiumId: string,
    phone: string,
    senderName: string,
    messageBody: string,
    condoName: string,
  ): Promise<AiAgentResult> {
    const message = `Olá ${senderName}! 👋\n\nSou o assistente virtual do condomínio *${condoName}*.\n\nIdentifiquei que seu número ainda não está cadastrado em nosso sistema. Para que eu possa atendê-lo, o síndico precisa realizar seu cadastro.\n\nJá notifiquei a administração sobre seu contato. Em breve alguém entrará em contato!\n\nSe for uma *emergência*, por favor descreva a situação que encaminharemos imediatamente. 🚨`;

    // Send response to resident
    await this.evolution.sendText(phone, message);

    // Notify Síndico
    await this.notifier.notifySindicoUnregistered({
      condominiumId,
      phone,
      name: senderName,
      messagePreview: messageBody.substring(0, 200),
    });

    return {
      responseMessage: message,
      action: 'unregistered_notified',
    };
  }

  private async processGeminiResponse(
    response: GeminiResponse,
    context: {
      condominiumId: string;
      conversationId: string;
      residentId?: string;
      phone: string;
      senderName: string;
    },
  ): Promise<AiAgentResult> {
    switch (response.type) {
      case 'TICKET': {
        return this.createTicketFromAi(response, context);
      }

      case 'UNREGISTERED': {
        await this.evolution.sendText(context.phone, response.message);
        return {
          responseMessage: response.message,
          action: 'unregistered_notified',
        };
      }

      case 'HANDOFF': {
        await this.evolution.sendText(context.phone, response.message);
        
        // Update database to assign to human
        await this.prisma.conversation.update({
          where: { id: context.conversationId },
          data: { isAiActive: false },
        });

        return {
          responseMessage: response.message,
          action: 'handoff',
        };
      }

      case 'CHAT':
      default: {
        // Send chat response
        await this.evolution.sendText(context.phone, response.message);

        // Update memory
        await this.memory.touchInteraction(context.condominiumId, context.phone);

        return {
          responseMessage: response.message,
          action: 'chat',
        };
      }
    }
  }

  private async createTicketFromAi(
    response: GeminiResponse,
    context: {
      condominiumId: string;
      conversationId: string;
      residentId?: string;
      phone: string;
      senderName: string;
    },
  ): Promise<AiAgentResult> {
    try {
      // 1. Create occurrence
      const occurrence = await this.occurrences.create({
        condominiumId: context.condominiumId,
        residentId: context.residentId,
        conversationId: context.conversationId,
        title: response.title || 'Chamado via WhatsApp',
        description: response.description || response.message,
        priority: response.priority || 'medium',
        metadata: {
          origin: 'whatsapp_ai',
          senderPhone: context.phone,
          senderName: context.senderName,
          aiGenerated: true,
        },
      });

      // 2. Trigger alert
      let alertId: string | undefined;
      if (response.priority === 'critical' || response.priority === 'high') {
        const alert = await this.alerts.trigger({
          condominiumId: context.condominiumId,
          occurrenceId: occurrence.id,
          triggerType: 'ai_agent',
          urgencyLevel: response.priority,
        });
        alertId = alert.id;
      }

      // 3. Notify Síndico via WhatsApp
      await this.notifier.notifySindicoNewTicket({
        condominiumId: context.condominiumId,
        occurrenceTitle: response.title || 'Chamado via WhatsApp',
        occurrenceDescription: response.description || response.message,
        priority: response.priority || 'medium',
        residentName: context.senderName,
        residentPhone: context.phone,
      });

      // 4. Send confirmation to resident
      await this.evolution.sendText(context.phone, response.message);

      // 5. Update memory with ticket context
      await this.memory.updateSummary(
        context.condominiumId,
        context.phone,
        `Último chamado: "${response.title}" (${response.priority}). ${response.description || ''}`,
      );

      this.logger.log(`AI created ticket "${response.title}" for ${context.senderName} (${context.phone})`);

      return {
        responseMessage: response.message,
        action: 'ticket_created',
        occurrenceId: occurrence.id,
        alertId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create ticket from AI: ${error.message}`);

      const fallbackMessage = 'Desculpe, houve um problema ao registrar seu chamado. O síndico já foi notificado e entrará em contato em breve.';
      await this.evolution.sendText(context.phone, fallbackMessage);

      return {
        responseMessage: fallbackMessage,
        action: 'fallback',
      };
    }
  }

  /**
   * Build Gemini conversation history from stored messages.
   */
  private async buildConversationHistory(conversationId: string): Promise<Content[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'asc' },
        take: 30, // Get more messages to account for grouping
        select: { direction: true, body: true, rawPayload: true },
      });

      const contents: Content[] = [];

      for (const m of messages) {
        if (!m.body) continue;
        
        // Skip system automation messages
        const payload = m.rawPayload as any;
        if (payload?.generatedBy === 'system') continue;

        const role = m.direction === 'inbound' ? 'user' : 'model';
        
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          // Collapse consecutive messages
          contents[contents.length - 1].parts[0].text += `\n\n${m.body}`;
        } else {
          contents.push({
            role,
            parts: [{ text: m.body }],
          });
        }
      }

      return contents;
    } catch (error) {
      this.logger.error(`Failed to build conversation history: ${(error as any).message}`);
      return [];
    }
  }
}
