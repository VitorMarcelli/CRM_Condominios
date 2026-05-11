import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionApiProvider,
  ) {}

  /**
   * Notify the Síndico (ADMIN) of a condominium about a new ticket via WhatsApp.
   */
  async notifySindicoNewTicket(data: {
    condominiumId: string;
    occurrenceTitle: string;
    occurrenceDescription: string;
    priority: string;
    residentName: string;
    residentPhone: string;
  }) {
    const condoName = await this.getCondominiumName(data.condominiumId);
    const priorityEmoji = this.getPriorityEmoji(data.priority);
    const priorityLabel = this.getPriorityLabel(data.priority);

    const message = `🚨 *NOVO CHAMADO — ${condoName}*

📋 *Título:* ${data.occurrenceTitle}
📝 *Descrição:* ${data.occurrenceDescription}
${priorityEmoji} *Prioridade:* ${priorityLabel}
👤 *Morador:* ${data.residentName}
📱 *Telefone:* ${data.residentPhone}
🕐 *Data:* ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

_Acesse o CRM para gerenciar este chamado._`;

    // Find all admins of this condominium that have a phone number
    const admins = await this.prisma.internalUser.findMany({
      where: {
        condominiumId: data.condominiumId,
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        phone: { not: null },
        status: 'active',
      },
      select: { id: true, fullName: true, phone: true },
    });

    // Also find SUPER_ADMIN without condominiumId (global admins)
    const globalAdmins = await this.prisma.internalUser.findMany({
      where: {
        role: 'SUPER_ADMIN',
        phone: { not: null },
        status: 'active',
        condominiumId: null,
      },
      select: { id: true, fullName: true, phone: true },
    });

    const allAdmins = [...admins, ...globalAdmins];

    if (allAdmins.length === 0) {
      this.logger.warn(`No admins with phone found for condominium ${data.condominiumId}`);
      return;
    }

    for (const admin of allAdmins) {
      if (!admin.phone) continue;
      try {
        const result = await this.evolution.sendText(admin.phone, message);
        if (result.success) {
          this.logger.log(`Notification sent to ${admin.fullName} (${admin.phone})`);
        } else {
          this.logger.warn(`Failed to notify ${admin.fullName}: ${result.error}`);
        }
      } catch (error: any) {
        this.logger.error(`Error notifying ${admin.fullName}: ${error.message}`);
      }
    }
  }

  /**
   * Notify Síndico about an unregistered resident trying to contact.
   */
  async notifySindicoUnregistered(data: {
    condominiumId: string;
    phone: string;
    name: string;
    messagePreview: string;
  }) {
    const condoName = await this.getCondominiumName(data.condominiumId);

    const message = `📋 *MORADOR NÃO CADASTRADO — ${condoName}*

Um número não identificado tentou contato:

👤 *Nome:* ${data.name}
📱 *Telefone:* ${data.phone}
💬 *Mensagem:* "${data.messagePreview}"

_Cadastre este morador no CRM para que ele possa utilizar o atendimento virtual._`;

    const admins = await this.prisma.internalUser.findMany({
      where: {
        OR: [
          { condominiumId: data.condominiumId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          { role: 'SUPER_ADMIN', condominiumId: null },
        ],
        phone: { not: null },
        status: 'active',
      },
      select: { phone: true },
    });

    for (const admin of admins) {
      if (!admin.phone) continue;
      try {
        await this.evolution.sendText(admin.phone, message);
      } catch (error: any) {
        this.logger.error(`Error notifying admin: ${error.message}`);
      }
    }
  }

  private async getCondominiumName(condominiumId: string): Promise<string> {
    const condo = await this.prisma.condominium.findUnique({
      where: { id: condominiumId },
      select: { name: true },
    });
    return condo?.name || 'Condomínio';
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  }

  private getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'critical': return 'CRÍTICA';
      case 'high': return 'ALTA';
      case 'medium': return 'MÉDIA';
      default: return 'BAIXA';
    }
  }
}
