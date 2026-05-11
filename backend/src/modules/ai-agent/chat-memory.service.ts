import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ChatMemoryService {
  private readonly logger = new Logger(ChatMemoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Load or create a ChatMemory record for a phone + condominium.
   */
  async getOrCreate(condominiumId: string, phone: string, residentId?: string) {
    const existing = await this.prisma.chatMemory.findUnique({
      where: {
        condominiumId_phone: { condominiumId, phone },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.chatMemory.create({
      data: {
        condominiumId,
        phone,
        residentId,
      },
    });
  }

  /**
   * Get context string for the AI prompt from stored memory.
   */
  async getContextForPrompt(condominiumId: string, phone: string): Promise<string | undefined> {
    const memory = await this.prisma.chatMemory.findUnique({
      where: {
        condominiumId_phone: { condominiumId, phone },
      },
    });

    if (!memory || !memory.summary) return undefined;

    const parts: string[] = [];
    parts.push(`Resumo de atendimentos anteriores: ${memory.summary}`);

    if (memory.preferences) {
      const prefs = memory.preferences as Record<string, any>;
      if (prefs.apartment) parts.push(`Apartamento: ${prefs.apartment}`);
      if (prefs.block) parts.push(`Bloco: ${prefs.block}`);
      if (prefs.issues) parts.push(`Problemas recorrentes: ${prefs.issues.join(', ')}`);
    }

    if (memory.lastInteraction) {
      parts.push(`Último contato: ${memory.lastInteraction.toLocaleDateString('pt-BR')}`);
    }

    return parts.join('\n');
  }

  /**
   * Update the memory summary after a conversation ends or a ticket is created.
   */
  async updateSummary(condominiumId: string, phone: string, summary: string) {
    await this.prisma.chatMemory.upsert({
      where: {
        condominiumId_phone: { condominiumId, phone },
      },
      update: {
        summary,
        lastInteraction: new Date(),
      },
      create: {
        condominiumId,
        phone,
        summary,
        lastInteraction: new Date(),
      },
    });
  }

  /**
   * Touch the last interaction timestamp.
   */
  async touchInteraction(condominiumId: string, phone: string) {
    try {
      await this.prisma.chatMemory.update({
        where: {
          condominiumId_phone: { condominiumId, phone },
        },
        data: { lastInteraction: new Date() },
      });
    } catch {
      // Record might not exist yet, that's okay
    }
  }
}
