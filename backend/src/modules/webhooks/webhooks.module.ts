import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { AfterHoursTriageService } from './after-hours-triage.service';
import { WhatsAppPayloadParser } from './services/whatsapp-parser.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { ResidentsModule } from '../residents/residents.module';
import { BusinessHoursModule } from '../business-hours/business-hours.module';
import { OccurrencesModule } from '../occurrences/occurrences.module';
import { AlertsModule } from '../alerts/alerts.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConversationsModule,
    ResidentsModule,
    BusinessHoursModule,
    OccurrencesModule,
    AlertsModule,
    AuditModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, AfterHoursTriageService, WhatsAppPayloadParser],
})
export class WebhooksModule {}
