import { api } from '@/lib/api';

export const dashboardService = {
  async getMetrics(condominiumId?: string) {
    const res = await api.get('/dashboard/metrics', { params: { condominiumId } });
    return res.data?.data || res.data;
  }
};
