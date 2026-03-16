import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/modules/auth/services/auth.service';
import { getCurrentTenant } from '../utils/tenantUtils';


export function useTenantGuard() {
  const router = useRouter();

  onMounted(() => {
    const currentTenant = getCurrentTenant();
    const storedTenant = authService.getTenant();
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
      if (import.meta.env.DEV) {
        console.warn(`[TenantGuard] Mismatch: current="${currentTenant}", stored="${storedTenant}". Clearing session.`);
      }

      authService.clearAuth();
      router.push({ name: 'Login' });
    }

    if (!isAuthenticated && storedTenant) {
      authService.clearAuth();
    }
  });

  return {
    validate: () => {
      const currentTenant = getCurrentTenant();
      const storedTenant = authService.getTenant();
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
        authService.clearAuth();
        router.push({ name: 'Login' });
        return false;
      }

      return true;
    },
  };
}
