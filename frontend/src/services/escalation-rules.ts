import { api } from '@/lib/api';

export interface EscalationRule {
  id: string;
  condominiumId: string;
  categoryId?: string;
  name: string;
  triggerKeywords?: string[];
  activeHours?: any;
  urgencyLevel: string;
  dispatchGroupId?: string;
  isActive: boolean;
  dispatchGroup?: any;
}

export const escalationRulesService = {
  async findAll(condominiumId?: string) {
    const { data } = await api.get('/escalation-rules', { params: { condominiumId } });
    return data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/escalation-rules/${id}`);
    return data;
  },

  async create(payload: Partial<EscalationRule>) {
    const { data } = await api.post('/escalation-rules', payload);
    return data;
  },

  async update(id: string, payload: Partial<EscalationRule>) {
    const { data } = await api.patch(`/escalation-rules/${id}`, payload);
    return data;
  }
};
