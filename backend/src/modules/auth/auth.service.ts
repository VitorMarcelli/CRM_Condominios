import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EvolutionApiProvider } from '../webhooks/providers/evolution-api.provider';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
    private evolution: EvolutionApiProvider,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.internalUser.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.condominiumId, user.organizationId);

    await this.prisma.internalUser.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    await this.audit.log({
      condominiumId: user.condominiumId,
      entityType: 'InternalUser',
      entityId: user.id,
      action: 'LOGIN',
      actorType: 'user',
      actorId: user.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        condominiumId: user.condominiumId,
        organizationId: user.organizationId,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.internalUser.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.condominiumId, user.organizationId);

      await this.prisma.internalUser.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.internalUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        customRoleId: true,
        permissions: true,
        condominiumId: true,
        organizationId: true,
        status: true,
        createdAt: true,
        condominium: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, color: true, permissions: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.internalUser.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If email exists, recovery instructions were sent' };
    }

    // TODO: Send email with reset token (future integration)
    await this.audit.log({
      condominiumId: user.condominiumId,
      entityType: 'InternalUser',
      entityId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      actorType: 'system',
    });

    return { message: 'If email exists, recovery instructions were sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Implement token validation (future)
    throw new BadRequestException('Password reset not yet implemented. Contact administrator.');
  }

  private async generateTokens(userId: string, email: string, role: string, condominiumId: string | null, organizationId: string | null) {
    const payload = { sub: userId, email, role, condominiumId, organizationId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload as any),
      this.jwt.signAsync(payload as any, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async supportRequest(dto: { name: string; unit: string; message: string }) {
    // Find SUPER_ADMINs or any admin that handles generic support
    const admins = await this.prisma.internalUser.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] },
        phone: { not: null },
        status: 'active',
      },
      select: { phone: true, fullName: true },
    });

    if (admins.length === 0) {
      this.logger.warn('No ADMIN with phone found for support request.');
      // Still return success to user so they aren't blocked, but log it.
      return { success: true };
    }

    const text = `🛠️ *NOVA SOLICITAÇÃO DE ACESSO/SUPORTE (Login)*\n\n👤 *Nome:* ${dto.name}\n🏢 *Unidade:* ${dto.unit}\n💬 *Mensagem:* ${dto.message}\n\n_Acesse o painel do CRM para providenciar o acesso._`;

    let sentCount = 0;
    for (const admin of admins) {
      if (admin.phone) {
        try {
          await this.evolution.sendText(admin.phone, text);
          sentCount++;
        } catch (error: any) {
          this.logger.error(`Failed to send WhatsApp to ${admin.fullName}: ${error.message}`);
        }
      }
    }
    
    this.logger.log(`Support request sent to ${sentCount} admins.`);
    return { success: true };
  }
}
