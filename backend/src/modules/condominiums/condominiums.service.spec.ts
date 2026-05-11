import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CondominiumsService', () => {
  let service: CondominiumsService;

  const mockPrisma = {
    condominium: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CondominiumsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<CondominiumsService>(CondominiumsService);
    jest.clearAllMocks();
  });

  // ─── CREATE ───────────────────────────────────────────────────
  describe('create', () => {
    it('should create a condominium and log audit', async () => {
      const dto = { name: 'Condo Sol', address: 'Rua A, 100', cnpj: '12345678000100' };
      const created = { id: 'condo-1', ...dto };
      mockPrisma.condominium.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue({});

      const result = await service.create(dto as any, 'actor-1');

      expect(result).toEqual(created);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          condominiumId: 'condo-1',
          action: 'CREATE',
          entityType: 'Condominium',
          actorId: 'actor-1',
        }),
      );
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated condominiums', async () => {
      const data = [{ id: 'condo-1', name: 'A' }];
      mockPrisma.condominium.findMany.mockResolvedValue(data);
      mockPrisma.condominium.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({ data, total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by status when provided', async () => {
      mockPrisma.condominium.findMany.mockResolvedValue([]);
      mockPrisma.condominium.count.mockResolvedValue(0);

      await service.findAll({ status: 'active' });

      expect(mockPrisma.condominium.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        }),
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return condominium with blocks and counts', async () => {
      const condo = {
        id: 'condo-1',
        name: 'Condo Sol',
        blocks: [{ id: 'block-1' }],
        _count: { residents: 50, units: 100, occurrences: 5 },
      };
      mockPrisma.condominium.findUnique.mockResolvedValue(condo);

      const result = await service.findOne('condo-1');

      expect(result).toEqual(condo);
      expect(mockPrisma.condominium.findUnique).toHaveBeenCalledWith({
        where: { id: 'condo-1' },
        include: {
          blocks: true,
          _count: { select: { residents: true, units: true, occurrences: true } },
        },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.condominium.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────
  describe('update', () => {
    it('should update and log audit with changes metadata', async () => {
      const existing = { id: 'condo-1', name: 'Old Name' };
      mockPrisma.condominium.findUnique.mockResolvedValue(existing);
      mockPrisma.condominium.update.mockResolvedValue({ ...existing, name: 'New Name' });
      mockAudit.log.mockResolvedValue({});

      const dto = { name: 'New Name' };
      await service.update('condo-1', dto as any, 'actor-1');

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          metadata: { changes: dto },
        }),
      );
    });

    it('should throw NotFoundException if condominium does not exist', async () => {
      mockPrisma.condominium.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {} as any, 'actor-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── UPDATE STATUS ────────────────────────────────────────────
  describe('updateStatus', () => {
    it('should update status and log STATUS_CHANGE audit', async () => {
      const existing = { id: 'condo-1', name: 'Test' };
      mockPrisma.condominium.findUnique.mockResolvedValue(existing);
      mockPrisma.condominium.update.mockResolvedValue({ ...existing, status: 'inactive' });
      mockAudit.log.mockResolvedValue({});

      await service.updateStatus('condo-1', 'inactive', 'actor-1');

      expect(mockPrisma.condominium.update).toHaveBeenCalledWith({
        where: { id: 'condo-1' },
        data: { status: 'inactive' },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_CHANGE',
          metadata: { newStatus: 'inactive' },
        }),
      );
    });
  });
});
