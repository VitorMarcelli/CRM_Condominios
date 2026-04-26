import { Module } from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { CondominiumsController } from './condominiums.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CondominiumsController],
  providers: [CondominiumsService],
  exports: [CondominiumsService],
})
export class CondominiumsModule {}
