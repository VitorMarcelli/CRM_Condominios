import { Module } from '@nestjs/common';
import { InternalUsersService } from './internal-users.service';
import { InternalUsersController } from './internal-users.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [InternalUsersController],
  providers: [InternalUsersService],
  exports: [InternalUsersService],
})
export class InternalUsersModule {}
