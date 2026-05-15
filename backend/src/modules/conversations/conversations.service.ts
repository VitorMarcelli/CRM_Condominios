import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findMessageByExternalId(externalId: string) {
    return this.prisma.message.findUnique({ where: { externalId } });
  }

  async findAll(params: { condominiumId?: string; status?: string; page?: number; limit?: number }) {
    const { condominiumId, status, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (condominiumId) where.condominiumId = condominiumId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          resident: { select: { id: true, fullName: true, phone: true } },
          condominium: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, fullName: true, role: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        resident: true,
        condominium: { select: { id: true, name: true } },
        messages: { orderBy: { sentAt: 'asc' } },
        occurrences: { take: 5, orderBy: { openedAt: 'desc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getMessages(conversationId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data, total, page, limit };
  }

  async addMessage(conversationId: string, data: {
    direction: string;
    senderName?: string;
    senderPhone?: string;
    body?: string;
    mediaUrl?: string;
    externalId?: string;
    rawPayload?: any;
  }) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const message = await this.prisma.message.create({
      data: { conversationId, ...data },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async createOrFindConversation(condominiumId: string, phone: string, residentId?: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        condominiumId,
        status: 'open',
        ...(residentId ? { residentId } : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        condominiumId,
        residentId,
        channel: 'whatsapp',
        externalReference: phone,
        status: 'open',
        isAiActive: true,
      },
    });
  }

  async takeOver(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const user = await this.prisma.internalUser.findUnique({ where: { id: userId } });
    
    // Add an outbound message
    await this.prisma.message.create({
      data: {
        conversationId: id,
        direction: 'outbound',
        body: `Atendimento assumido por ${user?.fullName || 'um operador'}.`,
        rawPayload: { generatedBy: 'system' }
      }
    });

    return this.prisma.conversation.update({
      where: { id },
      data: {
        isAiActive: false,
        assignedToId: userId,
      },
      include: { assignedTo: true }
    });
  }

  async resumeAi(id: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Add an outbound message
    await this.prisma.message.create({
      data: {
        conversationId: id,
        direction: 'outbound',
        body: `Atendimento devolvido para o Assistente de IA.`,
        rawPayload: { generatedBy: 'system' }
      }
    });

    return this.prisma.conversation.update({
      where: { id },
      data: {
        isAiActive: true,
        assignedToId: null,
      },
    });
  }
}
