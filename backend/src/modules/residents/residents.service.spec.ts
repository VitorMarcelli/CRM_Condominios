import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ResidentsService', () => {
  let service: ResidentsService;

  const mockPrisma = {
    resident: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
    jest.clearAllMocks();
  });

  // ─── CREATE ───────────────────────────────────────────────────
  describe('create', () => {
    it('should create a resident', async () => {
      const data = { condominiumId: 'condo-1', fullName: 'João Silva', phone: '21999001234' };
      const created = { id: 'res-1', ...data };
      mockPrisma.resident.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockPrisma.resident.create).toHaveBeenCalledWith({ data });
    });
  });

  // ─── FIND ALL (Multi-Tenant Isolation) ────────────────────────
  describe('findAll', () => {
    it('should enforce condominium isolation for non-super_admin users', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.resident.count.mockResolvedValue(0);

      await service.findAll({
        userRole: 'admin',
        userCondominiumId: 'condo-1',
      });

      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { condominiumId: 'condo-1' },
        }),
      );
    });

    it('should allow super_admin to query any condominium', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.resident.count.mockResolvedValue(0);

      await service.findAll({
        userRole: 'super_admin',
        condominiumId: 'condo-2',
      });

      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { condominiumId: 'condo-2' },
        }),
      );
    });

    it('should allow super_admin to see all condominiums when no filter', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.resident.count.mockResolvedValue(0);

      await service.findAll({ userRole: 'super_admin' });

      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should return correct pagination metadata', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);
      mockPrisma.resident.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result).toEqual({
        data: [],
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return resident with related data', async () => {
      const resident = {
        id: 'res-1',
        fullName: 'João Silva',
        unit: { number: '101', block: { name: 'A' } },
        condominium: { id: 'condo-1', name: 'Condo A' },
        conversations: [],
        occurrences: [],
      };
      mockPrisma.resident.findUnique.mockResolvedValue(resident);

      const result = await service.findOne('res-1');

      expect(result).toEqual(resident);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.resident.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── FIND BY PHONE ────────────────────────────────────────────
  describe('findByPhone', () => {
    it('should strip country code 55 for matching', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({ id: 'res-1' });

      await service.findByPhone('5521999001234');

      expect(mockPrisma.resident.findFirst).toHaveBeenCalledWith({
        where: {
          phone: { endsWith: '21999001234' },
          status: 'active',
        },
        include: { condominium: true, unit: true },
      });
    });

    it('should use phone as-is when not starting with 55', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue(null);

      await service.findByPhone('21999001234');

      expect(mockPrisma.resident.findFirst).toHaveBeenCalledWith({
        where: {
          phone: { endsWith: '21999001234' },
          status: 'active',
        },
        include: { condominium: true, unit: true },
      });
    });

    it('should not strip 55 if phone is too short (could be legitimate number)', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue(null);

      await service.findByPhone('5521999');

      // length 7, less than 12 — should NOT strip
      expect(mockPrisma.resident.findFirst).toHaveBeenCalledWith({
        where: {
          phone: { endsWith: '5521999' },
          status: 'active',
        },
        include: { condominium: true, unit: true },
      });
    });
  });

  // ─── SEARCH ───────────────────────────────────────────────────
  describe('search', () => {
    it('should search by name with case-insensitive contains', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);

      await service.search({ name: 'João', condominiumId: 'condo-1' });

      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            condominiumId: 'condo-1',
            fullName: { contains: 'João', mode: 'insensitive' },
          },
        }),
      );
    });

    it('should search by phone number', async () => {
      mockPrisma.resident.findMany.mockResolvedValue([]);

      await service.search({ phone: '999001234' });

      expect(mockPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: { contains: '999001234' } },
        }),
      );
    });
  });
});
