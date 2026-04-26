import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
