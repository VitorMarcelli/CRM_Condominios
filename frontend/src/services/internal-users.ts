import { api } from '@/lib/api';

export const internalUsersService = {
  async findAll(condominiumId?: string) {
    const { data } = await api.get('/internal-users', { params: { condominiumId } });
    return data;
  }
};
