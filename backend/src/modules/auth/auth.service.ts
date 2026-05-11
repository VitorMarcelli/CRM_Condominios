import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
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

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.condominiumId);

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

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.condominiumId);

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

  private async generateTokens(userId: string, email: string, role: string, condominiumId: string | null) {
    const payload = { sub: userId, email, role, condominiumId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload as any),
      this.jwt.signAsync(payload as any, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
