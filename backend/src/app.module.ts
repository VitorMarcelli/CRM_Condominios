import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CondominiumsModule } from './modules/condominiums/condominiums.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { UnitsModule } from './modules/units/units.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { InternalUsersModule } from './modules/internal-users/internal-users.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { OccurrencesModule } from './modules/occurrences/occurrences.module';
import { OccurrenceCategoriesModule } from './modules/occurrence-categories/occurrence-categories.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { EscalationRulesModule } from './modules/escalation-rules/escalation-rules.module';
import { DispatchGroupsModule } from './modules/dispatch-groups/dispatch-groups.module';
import { BusinessHoursModule } from './modules/business-hours/business-hours.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { EvolutionModule } from './modules/webhooks/providers/evolution.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomRolesModule } from './modules/custom-roles/custom-roles.module';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module';
import { AuditModule } from './modules/audit/audit.module';
import { PayablesModule } from './modules/payables/payables.module';
import { BillingModule } from './modules/billing/billing.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AppController } from './app.controller';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EvolutionModule,
    AuthModule,
    CondominiumsModule,
    BlocksModule,
    UnitsModule,
    ResidentsModule,
    InternalUsersModule,
    ConversationsModule,
    OccurrencesModule,
    OccurrenceCategoriesModule,
    AlertsModule,
    EscalationRulesModule,
    DispatchGroupsModule,
    BusinessHoursModule,
    WebhooksModule,
    DashboardModule,
    AuditModule,
    CustomRolesModule,
    AiAgentModule,
    PayablesModule,
    BillingModule,
    OnboardingModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
