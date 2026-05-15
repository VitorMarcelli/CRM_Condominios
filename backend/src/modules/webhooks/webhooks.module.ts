import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { ResidentsModule } from '../residents/residents.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ConversationsModule),
    ResidentsModule,
    forwardRef(() => AiAgentModule),
    AuditModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
