import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async onboard(dto: any) {
    // 1. Check if domain or email is already in use
    const existingOrg = await this.prisma.organization.findUnique({ where: { domain: dto.domain } });
    if (existingOrg) throw new ConflictException('Domain is already in use');

    const existingUser = await this.prisma.internalUser.findUnique({ where: { email: dto.adminEmail } });
    if (existingUser) throw new ConflictException('Email is already in use');

    // Generate a temporary password (in a real scenario, we'd send an email for them to set it)
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Get the Plan
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    return this.prisma.$transaction(async (tx) => {
      // 2. Create Organization
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: dto.domain.split('.')[0], // simplified slug
          domain: dto.domain,
          status: 'active',
          settings: {
            create: {
              timezone: 'America/Sao_Paulo',
              locale: 'pt-BR'
            }
          }
        },
      });

      // 3. Create Admin User
      const user = await tx.internalUser.create({
        data: {
          organizationId: org.id,
          fullName: dto.adminName,
          email: dto.adminEmail,
          phone: dto.adminPhone,
          role: 'ADMIN', // This represents the Organization Admin
          passwordHash,
          status: 'active',
        }
      });

      // 4. Create Asaas Customer
      const customerId = await this.billingService.createCustomer({
        name: dto.organizationName,
        document: dto.document,
        email: dto.adminEmail,
        phone: dto.adminPhone,
        externalReference: org.id,
      });

      // 5. Create Asaas Subscription
      // Set next due date to today + 7 days (trial period for example) or today. Let's do today.
      const today = new Date();
      const nextDueDate = today.toISOString().split('T')[0];
      
      const asaasSubscriptionId = await this.billingService.createSubscription({
        customerId,
        value: Number(plan.price),
        nextDueDate,
        description: `Assinatura ${plan.name} - ${dto.organizationName}`,
      });

      // 6. Save Subscription in DB
      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          asaasId: asaasSubscriptionId,
          status: 'active',
          startDate: new Date(),
          // endDate, nextDueDate etc based on your schema. 
          // Note: schema has `startDate` but no `nextDueDate`. We can omit nextDueDate from DB or store in endDate.
        }
      });

      return {
        success: true,
        organization: { id: org.id, name: org.name, domain: org.domain },
        admin: { id: user.id, email: user.email, tempPassword }, // Temporary return for dev purposes
      };
    });
  }

  async getPublicBranding(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { settings: true }
    });

    if (!org || org.status !== 'active') return null;

    return {
      id: org.id,
      name: org.name,
      branding: org.settings?.branding || {}
    };
  }

  async getAllOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: { condominiums: true, internalUsers: true }
        },
        subscriptions: {
          include: { plan: true },
          where: { status: 'active' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orgs.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      status: org.status,
      createdAt: org.createdAt,
      condominiumsCount: org._count.condominiums,
      usersCount: org._count.internalUsers,
      planName: org.subscriptions[0]?.plan?.name || 'N/A'
    }));
  }
}
