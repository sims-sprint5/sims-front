import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authService } from '../modules/auth/services/auth.service';
import { getCurrentTenant } from '../shared/utils/tenantUtils';
import { authRoutes } from '../modules/auth/routes';
import { dashboardRoutes } from '../modules/dashboard/routes';
import { settingsRoutes } from '../modules/settings/routes';
import { usersRoutes } from '../modules/users/routes';
import { ticketsRoutes } from '../modules/tickets/routes';
import { i18n } from '@/i18n';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  ...authRoutes,
  ...dashboardRoutes,
  ...settingsRoutes,
  ...usersRoutes,
  ...ticketsRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

/**
 * Crear instancia del router
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * Guard global de navegación
 * 1. Valida que el tenant del subdominio coincida con el tenant almacenado (GLOBAL)
 * 2. Protege las rutas que requieren autenticación
 */
router.beforeEach((to, _from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  const requiresAuth = to.meta.requiresAuth;
  const currentTenant = getCurrentTenant();
  const storedTenant = authService.getTenant();

  // Actualizar título de la página
  const titleKey = to.meta.titleKey as string | undefined;
  const pageTitle = titleKey ? i18n.global.t(titleKey) : i18n.global.t('app.name');
  document.title = `${pageTitle} | ${i18n.global.t('app.name')}`;

  // PHASE 1: Validación de Tenant - Protección Multi-Tenant
  // Si el usuario está autenticado, verificar que el tenant del subdominio actual
  // coincida con el tenant en el que fue autenticado
  if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
    // El usuario cambió de subdominio sin desautenticarse
    // Limpiar la sesión y redirigir al login
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  // Si la ruta requiere autenticación
  if (requiresAuth && !isAuthenticated) {
    // Redirigir al login
    next({ name: 'Login' });
    return;
  }

  // Si está autenticado e intenta acceder al login
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    // Redirigir al dashboard
    next({ name: 'Dashboard' });
    return;
  }

  // Permitir navegación
  next();
});

export default router;
