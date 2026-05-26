import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly asaasApiUrl: string;
  private readonly asaasApiKey: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.asaasApiUrl = this.config.get<string>('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    this.asaasApiKey = this.config.get<string>('ASAAS_API_KEY') || '';
  }

  private get headers() {
    return {
      access_token: this.asaasApiKey,
      'Content-Type': 'application/json',
    };
  }

  async createCustomer(data: { name: string; document: string; email: string; phone?: string; externalReference?: string }) {
    if (!this.asaasApiKey) {
      this.logger.warn('Asaas API Key is not configured. Skipping customer creation.');
      return `mock-cus-${Date.now()}`;
    }

    try {
      const response = await axios.post(
        `${this.asaasApiUrl}/customers`,
        {
          name: data.name,
          cpfCnpj: data.document,
          email: data.email,
          mobilePhone: data.phone,
          externalReference: data.externalReference,
        },
        { headers: this.headers }
      );

      return response.data.id as string;
    } catch (error: any) {
      this.logger.error(`Error creating customer in Asaas: ${error?.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException('Erro ao integrar com gateway de pagamento (Customer)');
    }
  }

  async createSubscription(data: { customerId: string; value: number; nextDueDate: string; description?: string }) {
    if (!this.asaasApiKey) {
      this.logger.warn('Asaas API Key is not configured. Skipping subscription creation.');
      return `mock-sub-${Date.now()}`;
    }

    try {
      const response = await axios.post(
        `${this.asaasApiUrl}/subscriptions`,
        {
          customer: data.customerId,
          billingType: 'UNDEFINED', // Allows Pix, Boleto, Credit Card
          value: data.value,
          nextDueDate: data.nextDueDate,
          cycle: 'MONTHLY',
          description: data.description,
        },
        { headers: this.headers }
      );

      return response.data.id as string;
    } catch (error: any) {
      this.logger.error(`Error creating subscription in Asaas: ${error?.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException('Erro ao integrar com gateway de pagamento (Subscription)');
    }
  }

  async handleWebhook(event: any) {
    this.logger.log(`Received Asaas webhook event: ${event.event}`);

    // Depending on the event, we handle Subscription and Payment (Invoice) status
    if (event.event.startsWith('PAYMENT_')) {
      await this.handlePaymentEvent(event);
    }
    
    return { received: true };
  }

  private async handlePaymentEvent(event: any) {
    const payment = event.payment;
    if (!payment) return;

    // payment.subscription is the Asaas subscription ID (if this payment belongs to a subscription)
    const asaasSubscriptionId = payment.subscription;

    if (asaasSubscriptionId) {
      // Find our local subscription
      const localSub = await this.prisma.subscription.findUnique({
        where: { asaasId: asaasSubscriptionId },
        include: { organization: true },
      });

      if (localSub) {
        // Sync invoice
        await this.syncInvoice(localSub.id, localSub.organizationId, payment);

        // Update local subscription status if necessary
        // For instance, if payment is OVERDUE, we might want to suspend the org, but usually Asaas handles subscription status separately.
        // For now, just logging.
        this.logger.log(`Synced invoice for subscription ${localSub.id}, payment: ${payment.id} with status ${payment.status}`);
      }
    }
  }

  private async syncInvoice(subscriptionId: string, organizationId: string, paymentData: any) {
    const pdfUrl = paymentData.invoiceUrl || paymentData.bankSlipUrl;
    let status = 'pending';

    switch (paymentData.status) {
      case 'RECEIVED':
      case 'CONFIRMED':
        status = 'paid';
        break;
      case 'OVERDUE':
        status = 'overdue';
        break;
      case 'REFUNDED':
        status = 'refunded';
        break;
      case 'DELETED':
        status = 'canceled';
        break;
      default:
        status = 'pending';
    }

    // Upsert invoice based on Asaas payment ID (we should store it, let's use externalId if we didn't add it to schema)
    // Looking at schema, Invoice has: id, subscriptionId, amount, status, dueDate, paidAt, invoiceUrl
    // We don't have asaasPaymentId on Invoice in schema. Let's use `invoiceUrl` or find by `dueDate` and `subscriptionId`.
    // Ideally, we'd alter schema to add `asaasPaymentId` to `Invoice`. But we can also just create it or update based on dueDate.

    // Better: We add `asaasPaymentId` to schema later, or just create a new invoice for each webhook if it doesn't exist.
    // For now, let's just create if not exists, or update if we find by a workaround (like matching dueDate).
    
    // Find existing by subscription and dueDate (Asaas usually creates one payment per cycle)
    const dueDateStr = new Date(paymentData.dueDate).toISOString();
    
    const existingInvoices = await this.prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const existing = existingInvoices.find(inv => inv.dueDate.toISOString() === dueDateStr || inv.pdfUrl === pdfUrl);

    if (existing) {
      await this.prisma.invoice.update({
        where: { id: existing.id },
        data: {
          status,
          paidAt: paymentData.paymentDate ? new Date(paymentData.paymentDate) : null,
          pdfUrl: pdfUrl || existing.pdfUrl,
        }
      });
    } else {
      await this.prisma.invoice.create({
        data: {
          organizationId,
          subscriptionId,
          amount: paymentData.value,
          status,
          dueDate: new Date(paymentData.dueDate),
          paidAt: paymentData.paymentDate ? new Date(paymentData.paymentDate) : null,
          pdfUrl,
        }
      });
    }
  }
}
