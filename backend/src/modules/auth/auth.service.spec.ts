import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    internalUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string, defaultVal?: string) => {
      const map: Record<string, string> = {
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] || defaultVal;
    }),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── LOGIN ────────────────────────────────────────────────────
  describe('login', () => {
    const dto = { email: 'admin@condo.com', password: 'Password123!' };

    const activeUser = {
      id: 'user-1',
      email: 'admin@condo.com',
      fullName: 'Admin',
      role: 'admin',
      condominiumId: 'condo-1',
      status: 'active',
      passwordHash: '$2b$10$hashedpassword',
    };

    it('should return tokens and user profile on valid credentials', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456');
      mockPrisma.internalUser.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: {
          id: 'user-1',
          email: 'admin@condo.com',
          fullName: 'Admin',
          role: 'admin',
          condominiumId: 'condo-1',
        },
      });
    });

    it('should persist refresh token in database', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt-saved');
      mockPrisma.internalUser.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.login(dto);

      expect(mockPrisma.internalUser.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: 'rt-saved' },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue({
        ...activeUser,
        status: 'inactive',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should log LOGIN audit event on success', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync.mockResolvedValue('token');
      mockPrisma.internalUser.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.login(dto);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN',
          entityType: 'InternalUser',
          actorId: 'user-1',
        }),
      );
    });
  });

  // ─── REFRESH TOKENS ───────────────────────────────────────────
  describe('refreshTokens', () => {
    it('should return new tokens on valid refresh token', async () => {
      const payload = { sub: 'user-1', email: 'a@b.com', role: 'admin' };
      const user = {
        id: 'user-1',
        email: 'a@b.com',
        role: 'admin',
        condominiumId: 'condo-1',
        refreshToken: 'valid-rt',
        status: 'active',
      };

      mockJwt.verify.mockReturnValue(payload);
      mockPrisma.internalUser.findUnique.mockResolvedValue(user);
      mockJwt.signAsync
        .mockResolvedValueOnce('new-at')
        .mockResolvedValueOnce('new-rt');
      mockPrisma.internalUser.update.mockResolvedValue({});

      const result = await service.refreshTokens('valid-rt');

      expect(result).toEqual({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      });
    });

    it('should throw when refresh token does not match stored token', async () => {
      const payload = { sub: 'user-1' };
      mockJwt.verify.mockReturnValue(payload);
      mockPrisma.internalUser.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshToken: 'different-token',
        status: 'active',
      });

      await expect(service.refreshTokens('wrong-rt')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user is inactive', async () => {
      const payload = { sub: 'user-1' };
      mockJwt.verify.mockReturnValue(payload);
      mockPrisma.internalUser.findUnique.mockResolvedValue({
        id: 'user-1',
        refreshToken: 'valid-rt',
        status: 'suspended',
      });

      await expect(service.refreshTokens('valid-rt')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on invalid/expired refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshTokens('expired-rt')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── GET ME ───────────────────────────────────────────────────
  describe('getMe', () => {
    it('should return user profile without sensitive data', async () => {
      const userProfile = {
        id: 'user-1',
        email: 'admin@condo.com',
        fullName: 'Admin',
        phone: '+5521999999',
        role: 'admin',
        condominiumId: 'condo-1',
        status: 'active',
        createdAt: new Date(),
        condominium: { id: 'condo-1', name: 'Condo A' },
      };
      mockPrisma.internalUser.findUnique.mockResolvedValue(userProfile);

      const result = await service.getMe('user-1');

      expect(result).toEqual(userProfile);
      expect(mockPrisma.internalUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          fullName: true,
          role: true,
        }),
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── FORGOT PASSWORD ─────────────────────────────────────────
  describe('forgotPassword', () => {
    it('should return generic message even when user not found (prevent enumeration)', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@email.com');

      expect(result.message).toBe('If email exists, recovery instructions were sent');
    });

    it('should log audit and return same generic message when user exists', async () => {
      mockPrisma.internalUser.findUnique.mockResolvedValue({
        id: 'user-1',
        condominiumId: 'condo-1',
      });
      mockAudit.log.mockResolvedValue({});

      const result = await service.forgotPassword('admin@condo.com');

      expect(result.message).toBe('If email exists, recovery instructions were sent');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FORGOT_PASSWORD_REQUEST',
          actorType: 'system',
        }),
      );
    });
  });

  // ─── RESET PASSWORD ──────────────────────────────────────────
  describe('resetPassword', () => {
    it('should throw BadRequestException (not yet implemented)', async () => {
      await expect(service.resetPassword('token', 'newPass'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
