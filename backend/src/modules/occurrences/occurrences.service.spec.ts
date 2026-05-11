import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('OccurrencesService', () => {
  let service: OccurrencesService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockPrisma = {
    occurrence: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    occurrenceTimeline: {
      create: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccurrencesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<OccurrencesService>(OccurrencesService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  // ─── CREATE ───────────────────────────────────────────────────
  describe('create', () => {
    const input = {
      condominiumId: 'condo-1',
      title: 'Portão travado',
      description: 'Portão da garagem não abre',
      priority: 'high',
    };

    it('should create an occurrence with default priority when none specified', async () => {
      const noPriorityInput = { condominiumId: 'condo-1', title: 'Teste' };
      const created = { id: 'occ-1', ...noPriorityInput, priority: 'medium' };
      mockPrisma.occurrence.create.mockResolvedValue(created);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});

      const result = await service.create(noPriorityInput);

      expect(mockPrisma.occurrence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ priority: 'medium' }),
      });
      expect(result).toEqual(created);
    });

    it('should create timeline entry with action CREATED', async () => {
      const created = { id: 'occ-1', ...input };
      mockPrisma.occurrence.create.mockResolvedValue(created);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});

      await service.create(input, 'actor-1');

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          occurrenceId: 'occ-1',
          action: 'CREATED',
          actorType: 'user',
          actorId: 'actor-1',
        }),
      });
    });

    it('should set actorType to system when no actorId provided', async () => {
      const created = { id: 'occ-1', ...input };
      mockPrisma.occurrence.create.mockResolvedValue(created);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});

      await service.create(input);

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actorType: 'system', actorId: undefined }),
      });
    });

    it('should log audit when actorId is provided', async () => {
      const created = { id: 'occ-1', ...input };
      mockPrisma.occurrence.create.mockResolvedValue(created);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.create(input, 'actor-1');

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          condominiumId: 'condo-1',
          entityType: 'Occurrence',
          action: 'CREATE',
          actorId: 'actor-1',
        }),
      );
    });

    it('should NOT log audit when no actorId', async () => {
      const created = { id: 'occ-1', ...input };
      mockPrisma.occurrence.create.mockResolvedValue(created);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});

      await service.create(input);

      expect(mockAudit.log).not.toHaveBeenCalled();
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results with default page/limit', async () => {
      const mockData = [{ id: 'occ-1' }];
      mockPrisma.occurrence.findMany.mockResolvedValue(mockData);
      mockPrisma.occurrence.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: mockData,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by condominiumId, status, priority', async () => {
      mockPrisma.occurrence.findMany.mockResolvedValue([]);
      mockPrisma.occurrence.count.mockResolvedValue(0);

      await service.findAll({
        condominiumId: 'condo-1',
        status: 'new',
        priority: 'high',
        page: 2,
        limit: 10,
      });

      expect(mockPrisma.occurrence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { condominiumId: 'condo-1', status: 'new', priority: 'high' },
          take: 10,
          skip: 10,
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      mockPrisma.occurrence.findMany.mockResolvedValue([]);
      mockPrisma.occurrence.count.mockResolvedValue(45);

      const result = await service.findAll({ limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────────
  describe('findOne', () => {
    const mockOccurrence = {
      id: 'occ-1',
      condominiumId: 'condo-1',
      title: 'Test',
      timeline: [{ id: 'tl-1', isInternal: false }],
    };

    it('should throw NotFoundException when occurrence does not exist', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should filter internal timeline entries for non-admin users', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(mockOccurrence);
      const regularUser = { role: 'manager', sub: 'user-1' };

      await service.findOne('occ-1', regularUser);

      expect(mockPrisma.occurrence.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            timeline: expect.objectContaining({
              where: { isInternal: false },
            }),
          }),
        }),
      );
    });

    it('should show all timeline entries (including internal) for admin users', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(mockOccurrence);
      const adminUser = { role: 'admin', sub: 'admin-1' };

      await service.findOne('occ-1', adminUser);

      expect(mockPrisma.occurrence.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            timeline: expect.objectContaining({
              where: undefined,
            }),
          }),
        }),
      );
    });

    it('should show all timeline entries for super_admin users', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(mockOccurrence);
      const superAdmin = { role: 'super_admin', sub: 'sa-1' };

      await service.findOne('occ-1', superAdmin);

      expect(mockPrisma.occurrence.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            timeline: expect.objectContaining({
              where: undefined,
            }),
          }),
        }),
      );
    });
  });

  // ─── UPDATE STATUS ────────────────────────────────────────────
  describe('updateStatus', () => {
    const existingOcc = { id: 'occ-1', condominiumId: 'condo-1', status: 'new' };

    it('should set closedAt when status is closed', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrence.update.mockResolvedValue({ ...existingOcc, status: 'closed' });
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.updateStatus('occ-1', 'closed', 'actor-1');

      expect(mockPrisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: expect.objectContaining({ status: 'closed', closedAt: expect.any(Date) }),
      });
    });

    it('should set closedAt when status is resolved', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrence.update.mockResolvedValue({ ...existingOcc, status: 'resolved' });
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.updateStatus('occ-1', 'resolved', 'actor-1');

      expect(mockPrisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: expect.objectContaining({ closedAt: expect.any(Date) }),
      });
    });

    it('should NOT set closedAt for intermediate statuses', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrence.update.mockResolvedValue({ ...existingOcc, status: 'in_progress' });
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.updateStatus('occ-1', 'in_progress', 'actor-1');

      expect(mockPrisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: { status: 'in_progress' },
      });
    });

    it('should create STATUS_CHANGE timeline entry with old/new status metadata', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrence.update.mockResolvedValue({});
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});

      await service.updateStatus('occ-1', 'in_progress', 'actor-1');

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'STATUS_CHANGE',
          metadata: { oldStatus: 'new', newStatus: 'in_progress' },
        }),
      });
    });
  });

  // ─── ADD TIMELINE ENTRY ───────────────────────────────────────
  describe('addTimelineEntry', () => {
    const existingOcc = { id: 'occ-1', condominiumId: 'condo-1' };
    const adminUser = { role: 'admin', sub: 'admin-1' };

    it('should create a NOTE timeline entry', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      const timelineResult = { id: 'tl-1', action: 'NOTE' };
      mockPrisma.occurrenceTimeline.create.mockResolvedValue(timelineResult);

      const result = await service.addTimelineEntry(
        'occ-1',
        { description: 'Nota pública' },
        adminUser,
      );

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'NOTE',
          description: 'Nota pública',
          isInternal: false,
          actorId: 'admin-1',
        }),
      });
      expect(result).toEqual(timelineResult);
    });

    it('should create internal note and log audit for internal entries', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      const timelineResult = { id: 'tl-2', action: 'NOTE' };
      mockPrisma.occurrenceTimeline.create.mockResolvedValue(timelineResult);
      mockAudit.log.mockResolvedValue({});

      await service.addTimelineEntry(
        'occ-1',
        { description: 'Nota interna sigilosa', isInternal: true },
        adminUser,
      );

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isInternal: true }),
      });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE_INTERNAL_NOTE',
          entityType: 'OccurrenceTimeline',
        }),
      );
    });

    it('should NOT log audit for public notes', async () => {
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({ id: 'tl-3' });

      await service.addTimelineEntry(
        'occ-1',
        { description: 'Public note' },
        adminUser,
      );

      expect(mockAudit.log).not.toHaveBeenCalled();
    });
  });

  // ─── ASSIGN ───────────────────────────────────────────────────
  describe('assign', () => {
    it('should assign user and create timeline entry', async () => {
      const existingOcc = { id: 'occ-1', condominiumId: 'condo-1' };
      mockPrisma.occurrence.findUnique.mockResolvedValue(existingOcc);
      mockPrisma.occurrence.update.mockResolvedValue({ ...existingOcc, assignedUserId: 'user-2' });
      mockPrisma.occurrenceTimeline.create.mockResolvedValue({});

      await service.assign('occ-1', 'user-2', 'actor-1');

      expect(mockPrisma.occurrence.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: { assignedUserId: 'user-2' },
      });

      expect(mockPrisma.occurrenceTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ASSIGNED',
          metadata: { assignedUserId: 'user-2' },
        }),
      });
    });
  });
});
