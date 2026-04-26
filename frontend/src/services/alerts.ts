import { api } from '@/lib/api';

export interface Alert {
  id: string;
  condominiumId: string;
  occurrenceId: string;
  triggerType: string;
  urgencyLevel: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  closedAt?: string;
  occurrence?: any;
  condominium?: any;
  recipients?: AlertRecipient[];
}

export interface AlertRecipient {
  id: string;
  alertId: string;
  userId: string;
  channel: string;
  status: string;
  sentAt?: string;
  readAt?: string;
  user?: any;
}

export const alertsService = {
  async findAll(params?: { condominiumId?: string; status?: string; urgencyLevel?: string; occurrenceId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { data } = await api.get('/alerts', { params });
    return data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/alerts/${id}`);
    return data;
  },

  async trigger(payload: { condominiumId: string; occurrenceId: string; triggerType: string; urgencyLevel: string }) {
    const { data } = await api.post('/alerts/trigger', payload);
    return data;
  },

  async acknowledge(id: string) {
    const { data } = await api.post(`/alerts/${id}/acknowledge`);
    return data;
  },

  async close(id: string) {
    const { data } = await api.post(`/alerts/${id}/close`);
    return data;
  }
};
