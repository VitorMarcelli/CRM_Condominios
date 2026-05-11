import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AlertsService', () => {
  let service: AlertsService;
  const mockPrisma = {
    alert: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    escalationRule: { findMany: jest.fn() },
    alertRecipient: { create: jest.fn(), update: jest.fn() },
  };
  const mockAudit = { log: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  describe('trigger', () => {
    const data = { condominiumId: 'c1', occurrenceId: 'o1', triggerType: 'SLA', urgencyLevel: 'high' };

    it('should create alert and dispatch to group members', async () => {
      mockPrisma.alert.create.mockResolvedValue({ id: 'a1' });
      mockPrisma.escalationRule.findMany.mockResolvedValue([{
        dispatchGroup: { members: [{ userId: 'u1', user: {} }, { userId: 'u2', user: {} }] },
      }]);
      mockPrisma.alertRecipient.create.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});
      await service.trigger(data);
      expect(mockPrisma.alertRecipient.create).toHaveBeenCalledTimes(2);
    });

    it('should handle rules without dispatch groups', async () => {
      mockPrisma.alert.create.mockResolvedValue({ id: 'a1' });
      mockPrisma.escalationRule.findMany.mockResolvedValue([{ dispatchGroup: null }]);
      mockAudit.log.mockResolvedValue({});
      await service.trigger(data);
      expect(mockPrisma.alertRecipient.create).not.toHaveBeenCalled();
    });

    it('should set actorType based on actorId presence', async () => {
      mockPrisma.alert.create.mockResolvedValue({ id: 'a1' });
      mockPrisma.escalationRule.findMany.mockResolvedValue([]);
      mockAudit.log.mockResolvedValue({});
      await service.trigger(data, 'actor-1');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'user', actorId: 'actor-1' }));
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('acknowledge', () => {
    it('should set acknowledged status with timestamp', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ id: 'a1', condominiumId: 'c1' });
      mockPrisma.alert.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});
      await service.acknowledge('a1', 'actor-1');
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { id: 'a1' }, data: { status: 'acknowledged', acknowledgedAt: expect.any(Date) },
      });
    });
  });

  describe('close', () => {
    it('should set closed status with timestamp', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ id: 'a1', condominiumId: 'c1' });
      mockPrisma.alert.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});
      await service.close('a1', 'actor-1');
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { id: 'a1' }, data: { status: 'closed', closedAt: expect.any(Date) },
      });
    });
  });

  describe('updateRecipientStatus', () => {
    it('should set sentAt when status is sent', async () => {
      mockPrisma.alertRecipient.update.mockResolvedValue({});
      await service.updateRecipientStatus('r1', 'sent');
      expect(mockPrisma.alertRecipient.update).toHaveBeenCalledWith({
        where: { id: 'r1' }, data: { status: 'sent', sentAt: expect.any(Date) },
      });
    });

    it('should NOT set sentAt for non-sent statuses', async () => {
      mockPrisma.alertRecipient.update.mockResolvedValue({});
      await service.updateRecipientStatus('r1', 'failed');
      expect(mockPrisma.alertRecipient.update).toHaveBeenCalledWith({
        where: { id: 'r1' }, data: { status: 'failed' },
      });
    });
  });
});
