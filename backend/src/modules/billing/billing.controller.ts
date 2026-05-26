import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Post('asaas-webhook')
  @ApiExcludeEndpoint()
  async handleAsaasWebhook(
    @Body() payload: any,
    @Headers('asaas-access-token') accessToken: string,
  ) {
    const configuredToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');

    if (configuredToken && accessToken !== configuredToken) {
      this.logger.warn('Invalid Asaas Webhook Token received');
      throw new UnauthorizedException('Invalid webhook token');
    }

    return this.billingService.handleWebhook(payload);
  }
}
