import { api } from '@/lib/api';

export interface DispatchGroup {
  id: string;
  condominiumId: string;
  name: string;
  description?: string;
  isActive: boolean;
  members?: DispatchGroupMember[];
}

export interface DispatchGroupMember {
  id: string;
  dispatchGroupId: string;
  userId: string;
  priority: number;
  user?: any;
}

export const dispatchGroupsService = {
  async findAll(condominiumId?: string) {
    const { data } = await api.get('/dispatch-groups', { params: { condominiumId } });
    return data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/dispatch-groups/${id}`);
    return data;
  },

  async create(payload: { condominiumId: string; name: string; description?: string }) {
    const { data } = await api.post('/dispatch-groups', payload);
    return data;
  },

  async update(id: string, payload: { name?: string; description?: string; isActive?: boolean }) {
    const { data } = await api.put(`/dispatch-groups/${id}`, payload);
    return data;
  },

  async addMember(groupId: string, payload: { userId: string; priority?: number }) {
    const { data } = await api.post(`/dispatch-groups/${groupId}/members`, payload);
    return data;
  },

  async removeMember(groupId: string, userId: string) {
    const { data } = await api.delete(`/dispatch-groups/${groupId}/members/${userId}`);
    return data;
  }
};
