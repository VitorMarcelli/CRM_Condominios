import { api } from '@/lib/api';

export const auditService = {
  async findAll(params?: { condominiumId?: string; entityType?: string; action?: string; limit?: number }) {
    const { data } = await api.get('/audit-logs', { params });
    return data;
  }
};
