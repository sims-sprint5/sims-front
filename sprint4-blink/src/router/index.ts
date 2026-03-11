import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authService } from '../modules/auth/services/auth.service';
import { getCurrentTenant } from '../shared/utils/tenantUtils';
import { authRoutes } from '../modules/auth/routes';
import { dashboardRoutes } from '../modules/dashboard/routes';
import { settingsRoutes } from '../modules/settings/routes';
import { usersRoutes } from '../modules/users/routes';
import { vehiclesRoutes } from '../modules/vehicles/routes';
import { reservationsRoutes } from '../modules/reservations/routes';
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
  ...vehiclesRoutes,
  ...reservationsRoutes,
  ...ticketsRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

/**
 * Create router instance
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * Global navigation guard.
 * 1. Validates that the subdomain tenant matches the stored tenant.
 * 2. Protects routes that require authentication.
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

  // If the subdomain has changed since login, clear session and redirect
  if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
