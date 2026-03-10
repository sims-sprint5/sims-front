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

    // Si está autenticado y el tenant no coincide, logout automático
    if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
      if (import.meta.env.DEV) {
        console.warn(
          `[Tenant Guard] Mismatch detectado. Current: "${currentTenant}", Stored: "${storedTenant}". Limpiando sesión...`
        );
      }

      authService.clearAuth();
      router.push({ name: 'Login' });
    }

    // Si no está autenticado pero hay datos en localStorage, limpiar
    if (!isAuthenticated && storedTenant) {
      if (import.meta.env.DEV) {
        console.warn(
          `[Tenant Guard] Sesión inconsistente detectada. Limpiando localStorage...`
        );
      }
      authService.clearAuth();
    }
  });

  return {
    /**
     * Fuerza una validación manual del tenant
     * Útil si necesitas re-validar en algún momento específico
     */
    validate: () => {
      const currentTenant = getCurrentTenant();
      const storedTenant = authService.getTenant();
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
        if (import.meta.env.DEV) {
          console.warn(
            `[Tenant Guard] Validación manual: Mismatch. Current: "${currentTenant}", Stored: "${storedTenant}"`
          );
        }
        authService.clearAuth();
        router.push({ name: 'Login' });
        return false;
      }

      return true;
    },
  };
}
