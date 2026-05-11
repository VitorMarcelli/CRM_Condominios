import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAgentService } from './ai-agent.service';
import { GeminiService } from './gemini.service';
import { ChatMemoryService } from './chat-memory.service';
import { NotifierService } from './notifier.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { OccurrencesModule } from '../occurrences/occurrences.module';
import { AlertsModule } from '../alerts/alerts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => OccurrencesModule),
    AlertsModule,
    ConversationsModule,
  ],
  providers: [
    AiAgentService,
    GeminiService,
    ChatMemoryService,
    NotifierService,
    EvolutionApiProvider,
  ],
  exports: [AiAgentService, GeminiService, ChatMemoryService, NotifierService, EvolutionApiProvider],
})
export class AiAgentModule {}
