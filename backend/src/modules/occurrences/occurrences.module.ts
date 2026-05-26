import { Module } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';
import { AuditModule } from '../audit/audit.module';
import { EvolutionModule } from '../webhooks/providers/evolution.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuditModule, EvolutionModule, AlertsModule],
  controllers: [OccurrencesController],
  providers: [OccurrencesService],
  exports: [OccurrencesService],
})
export class OccurrencesModule {}
