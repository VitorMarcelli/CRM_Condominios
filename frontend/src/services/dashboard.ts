import { api } from '@/lib/api';

export const dashboardService = {
  async getMetrics(condominiumId?: string) {
    const { data } = await api.get('/dashboard/metrics', { params: { condominiumId } });
    return data;
  }
};
