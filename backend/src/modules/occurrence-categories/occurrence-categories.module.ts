import { Module } from '@nestjs/common';
import { OccurrenceCategoriesService } from './occurrence-categories.service';
import { OccurrenceCategoriesController } from './occurrence-categories.controller';

@Module({
  controllers: [OccurrenceCategoriesController],
  providers: [OccurrenceCategoriesService],
  exports: [OccurrenceCategoriesService],
})
export class OccurrenceCategoriesModule {}
