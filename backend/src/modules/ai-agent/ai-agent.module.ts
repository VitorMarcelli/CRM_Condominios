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
  ],
  exports: [AiAgentService, GeminiService, ChatMemoryService, NotifierService],
})
export class AiAgentModule {}
