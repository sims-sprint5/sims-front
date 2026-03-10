import { computed } from 'vue';
import { getCurrentTenant, getTenantApiBaseUrl, buildTenantApiUrl, getTenantInfo } from '../utils/tenantUtils';

/**
 * Composable per accedir a la información del tenant actual
 * 
 * Ús:
 * ```vue
 * <script setup>
 * import { useTenant } from '@/shared/composables/useTenant'
 * 
 * const { tenant, apiBaseUrl, info } = useTenant()
 * </script>
 * ```
 */
export function useTenant() {
  const tenant = computed(() => getCurrentTenant());
  const apiBaseUrl = computed(() => getTenantApiBaseUrl());
  const info = computed(() => getTenantInfo());

  return {
    tenant,
    apiBaseUrl,
    info,
    buildUrl: (endpoint: string) => buildTenantApiUrl(endpoint),
  };
}
