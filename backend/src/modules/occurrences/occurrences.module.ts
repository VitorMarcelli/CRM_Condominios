import { Module } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [OccurrencesController],
  providers: [OccurrencesService],
  exports: [OccurrencesService],
})
export class OccurrencesModule {}
