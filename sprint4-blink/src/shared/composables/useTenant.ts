import { computed } from 'vue';
import { getCurrentTenant, getTenantApiBaseUrl, buildTenantApiUrl, getTenantInfo } from '../utils/tenantUtils';

export function useTenant() {
  return {
    tenant: computed(() => getCurrentTenant()),
    apiBaseUrl: computed(() => getTenantApiBaseUrl()),
    info: computed(() => getTenantInfo()),
    buildUrl: (endpoint: string) => buildTenantApiUrl(endpoint),
  };
}
