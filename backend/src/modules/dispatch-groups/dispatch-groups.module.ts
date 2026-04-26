import { Module } from '@nestjs/common';
import { DispatchGroupsController } from './dispatch-groups.controller';
import { DispatchGroupsService } from './dispatch-groups.service';

@Module({
  controllers: [DispatchGroupsController],
  providers: [DispatchGroupsService],
  exports: [DispatchGroupsService],
})
export class DispatchGroupsModule {}
