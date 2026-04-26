import { Injectable, Logger } from '@nestjs/common';
import { BusinessHoursService } from '../business-hours/business-hours.service';
import { OccurrencesService } from '../occurrences/occurrences.service';
import { AlertsService } from '../alerts/alerts.service';

import { PrismaService } from '../../common/prisma/prisma.service';

interface TriageInput {
  condominiumId: string;
  conversationId: string;
  residentId?: string;
  messageBody: string;
  senderPhone: string;
}

export interface TriageResult {
  action: 'auto_response' | 'occurrence_created' | 'alert_triggered' | 'queued_for_human';
  isAfterHours: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  occurrenceId?: string;
  alertId?: string;
  autoResponse?: string;
  ruleId?: string;
}


@Injectable()
export class AfterHoursTriageService {
  private readonly logger = new Logger(AfterHoursTriageService.name);

  constructor(
    private businessHours: BusinessHoursService,
    private occurrences: OccurrencesService,
    private alerts: AlertsService,
    private prisma: PrismaService,
  ) {}

  async processMessage(input: TriageInput): Promise<TriageResult> {
    // 1. Check business hours
    const isWithinHours = await this.businessHours.isWithinBusinessHours(input.condominiumId);
    const isAfterHours = !isWithinHours;

    // 2. Classify urgency
    const urgency = await this.classifyMessageUrgency(input.condominiumId, input.messageBody);
    const urgencyLevel = urgency.level;
    const matchedKeyword = urgency.keyword;
    const ruleId = urgency.ruleId;
    const ruleName = urgency.ruleName;

    // 3. If within business hours and not critical, queue for human
    if (!isAfterHours && urgencyLevel !== 'critical') {
      return {
        action: 'queued_for_human',
        isAfterHours: false,
        urgencyLevel,
      };
    }

    // 4. If after hours or critical, proceed with automation
    if (urgencyLevel === 'critical' || urgencyLevel === 'high') {
      // Create occurrence automatically
      const occurrence = await this.occurrences.create({
        condominiumId: input.condominiumId,
        residentId: input.residentId,
        conversationId: input.conversationId,
        title: this.generateOccurrenceTitle(input.messageBody, urgencyLevel),
        description: input.messageBody,
        priority: urgencyLevel,
        metadata: {
          origin: 'whatsapp_mock',
          originalMessage: input.messageBody,
          residentIdentified: !!input.residentId,
          assignedPriority: urgencyLevel,
          matchedKeyword,
          ruleName,
          isAfterHours,
          alertNeeded: urgencyLevel === 'critical',
        },
      });

      // Trigger alert for critical
      if (urgencyLevel === 'critical') {
        const alert = await this.alerts.trigger({
          condominiumId: input.condominiumId,
          occurrenceId: occurrence.id,
          triggerType: 'auto_triage',
          urgencyLevel: 'critical',
        });

        return {
          action: 'alert_triggered',
          isAfterHours,
          urgencyLevel,
          occurrenceId: occurrence.id,
          alertId: alert.id,
          autoResponse: this.getAutoResponse(urgencyLevel, isAfterHours),
        };
      }

      return {
        action: 'occurrence_created',
        isAfterHours,
        urgencyLevel,
        occurrenceId: occurrence.id,
        autoResponse: this.getAutoResponse(urgencyLevel, isAfterHours),
      };
    }

    // 5. After hours, non-critical: auto-response + log
    return {
      action: 'auto_response',
      isAfterHours,
      urgencyLevel,
      autoResponse: this.getAutoResponse(urgencyLevel, isAfterHours),
    };
  }

  async classifyMessageUrgency(condominiumId: string, body: string): Promise<{ level: 'low' | 'medium' | 'high' | 'critical', keyword?: string, ruleId?: string, ruleName?: string }> {
    const normalizedBody = body.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const rules = await this.prisma.escalationRule.findMany({
      where: { condominiumId, isActive: true },
      orderBy: { urgencyLevel: 'asc' } // Hack to get critical first if 'critical' < 'high', wait, it's string. Better to sort in memory or trust priority.
    });

    const ruleOrder = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
    rules.sort((a, b) => (ruleOrder[a.urgencyLevel as keyof typeof ruleOrder] || 5) - (ruleOrder[b.urgencyLevel as keyof typeof ruleOrder] || 5));

    for (const rule of rules) {
      if (!rule.triggerKeywords || !Array.isArray(rule.triggerKeywords)) continue;
      
      for (const keyword of rule.triggerKeywords as string[]) {
        const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedBody.includes(normalizedKeyword)) {
          return { 
            level: rule.urgencyLevel as 'critical' | 'high' | 'medium' | 'low', 
            keyword, 
            ruleId: rule.id, 
            ruleName: rule.name 
          };
        }
      }
    }

    // Fallback if no rules match
    const fallbackKeywords = ['urgente', 'socorro', 'emergencia', 'risco'];
    for (const keyword of fallbackKeywords) {
      if (normalizedBody.includes(keyword)) {
        return { level: 'critical', keyword: 'fallback_emergency', ruleName: 'Regra de Segurança Padrão' };
      }
    }

    return { level: 'medium' };
  }

  private generateOccurrenceTitle(body: string, urgency: string): string {
    const prefix = urgency === 'critical' ? '🚨 CRÍTICO' : '⚠️ URGENTE';
    const preview = body.length > 60 ? body.substring(0, 60) + '...' : body;
    return `${prefix}: ${preview}`;
  }

  private getAutoResponse(urgency: string, isAfterHours: boolean): string {
    if (urgency === 'critical') {
      return 'Sua mensagem foi identificada como URGENTE. Os responsáveis foram acionados imediatamente. Um protocolo de emergência foi aberto.';
    }

    if (urgency === 'high') {
      return 'Sua mensagem foi registrada com prioridade alta. Uma ocorrência foi aberta e o responsável será notificado em breve.';
    }

    if (isAfterHours) {
      return 'Obrigado por entrar em contato. No momento estamos fora do horário de atendimento. Sua mensagem foi registrada e será respondida no próximo horário comercial. Em caso de emergência, descreva a situação com mais detalhes.';
    }

    return 'Sua mensagem foi recebida e será atendida em breve.';
  }
}
