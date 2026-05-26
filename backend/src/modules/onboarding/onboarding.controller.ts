import { Controller, Post, Body, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
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

  @Get('organizations')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all organizations (Super Admin only)' })
  async getAllOrganizations() {
    return this.onboardingService.getAllOrganizations();
  }
}
