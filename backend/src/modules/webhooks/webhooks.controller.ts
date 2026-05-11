import { Controller, Post, Get, Body, HttpCode, HttpStatus, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { EvolutionApiProvider } from './providers/evolution-api.provider';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private service: WebhooksService,
    private evolution: EvolutionApiProvider,
  ) {}

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evolution API webhook endpoint (no auth required)' })
  handleWhatsApp(@Body() payload: any, @Headers('x-condominium-id') condominiumIdHeader: string) {
    return this.service.handleEvolutionWebhook(payload, condominiumIdHeader);
  }

  @Get('evolution/status')
  @ApiOperation({ summary: 'Check Evolution API connection status' })
  getConnectionStatus() {
    return this.evolution.getConnectionStatus();
  }

  @Get('evolution/qrcode')
  @ApiOperation({ summary: 'Get QR code for WhatsApp connection' })
  getQrCode() {
    return this.evolution.getQrCode();
  }

  @Post('evolution/instance')
  @ApiOperation({ summary: 'Create a new Evolution API instance' })
  createInstance(@Body() body: { instanceName?: string }) {
    return this.evolution.createInstance(body.instanceName);
  }

  @Post('evolution/webhook')
  @ApiOperation({ summary: 'Configure webhook URL for Evolution API instance' })
  setWebhook(@Body() body: { webhookUrl: string; instanceName?: string }) {
    return this.evolution.setWebhook(body.webhookUrl, body.instanceName);
  }
}
