import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  organizationId?: string | null;
  condominiumId?: string | null;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();
