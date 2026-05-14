import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AuditModule } from '../audit/audit.module';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';

@Module({
  imports: [AuditModule, ConfigModule],
  controllers: [AlertsController],
  providers: [AlertsService, EvolutionApiProvider],
  exports: [AlertsService],
})
export class AlertsModule {}
