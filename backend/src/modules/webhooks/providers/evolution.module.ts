import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvolutionApiProvider } from './evolution-api.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EvolutionApiProvider],
  exports: [EvolutionApiProvider],
})
export class EvolutionModule {}
