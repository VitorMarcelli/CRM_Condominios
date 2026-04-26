import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook endpoint (no auth required)' })
  handleWhatsApp(@Body() payload: any, @Headers('x-condominium-id') condominiumIdHeader: string) {
    return this.service.handleWhatsAppWebhook(payload, condominiumIdHeader);
  }
}
