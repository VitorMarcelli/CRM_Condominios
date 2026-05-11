import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  const mockPrisma = {
    auditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log entry with all fields', async () => {
      const input = {
        condominiumId: 'condo-1',
        entityType: 'Occurrence',
        entityId: 'occ-1',
        action: 'CREATE',
        actorType: 'user',
        actorId: 'user-1',
        metadata: { key: 'value' },
        ipAddress: '192.168.1.1',
      };
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1', ...input });

      const result = await service.log(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          condominiumId: 'condo-1',
          entityType: 'Occurrence',
          action: 'CREATE',
          actorId: 'user-1',
        }),
      });
      expect(result.id).toBe('log-1');
    });

    it('should handle null condominiumId gracefully', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-2' });

      await service.log({
        condominiumId: null,
        entityType: 'System',
        action: 'STARTUP',
        actorType: 'system',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ condominiumId: undefined }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results with filters', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: 'log-1' }]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({
        condominiumId: 'condo-1',
        entityType: 'Occurrence',
        action: 'CREATE',
      });

      expect(result).toEqual({ data: [{ id: 'log-1' }], total: 1, page: 1, limit: 50, totalPages: 1 });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { condominiumId: 'condo-1', entityType: 'Occurrence', action: 'CREATE' },
        }),
      );
    });

    it('should use default page=1, limit=50', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({});

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });
  });
});
