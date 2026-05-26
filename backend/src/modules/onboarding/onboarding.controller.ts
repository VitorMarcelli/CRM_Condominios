import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';

class CreateOnboardingDto {
  organizationName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: string;
  document: string;
}

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new Organization, Admin User, and Billing Subscription' })
  async createOrganization(@Body() dto: CreateOnboardingDto) {
    return this.onboardingService.onboard(dto);
  }

  @Get('organization/:slug')
  @ApiOperation({ summary: 'Get Organization public branding data by slug' })
  async getOrganizationBySlug(@Param('slug') slug: string) {
    const org = await this.onboardingService.getPublicBranding(slug);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
