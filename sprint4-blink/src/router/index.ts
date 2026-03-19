import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authService } from '../modules/auth/services/auth.service';
import { getCurrentTenant, isSuperadminHost } from '../shared/utils/tenantUtils';
import { authRoutes } from '../modules/auth/routes';
import { settingsRoutes } from '../modules/settings/routes';
import { usersRoutes } from '../modules/users/routes';
import { vehiclesRoutes } from '../modules/vehicles/routes';
import { reservationsRoutes } from '../modules/reservations/routes';
import { ticketsRoutes } from '../modules/tickets/routes';
import { superadminRoutes } from '../modules/superadmin/routes';
import mapaRoutes from '../modules/mapa/routes';
import { i18n } from '@/i18n';
import { hasAllowedRole } from '@/shared/utils/roleUtils';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => (isSuperadminHost() ? '/superadmin/login' : '/login'),
  },
  ...authRoutes,
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/shared/views/UnauthorizedView.vue'),
    meta: {
      requiresAuth: false,
      titleKey: 'unauthorized.title',
    },
  },
  ...settingsRoutes,
  ...usersRoutes,
  ...vehiclesRoutes,
  ...reservationsRoutes,
  ...ticketsRoutes,
  ...mapaRoutes,
  ...superadminRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: () => (isSuperadminHost() ? '/superadmin/login' : '/login'),
  },
];

/**
 * Create router instance
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});


router.beforeEach((to, _from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const isSuperadminRoute = to.path.startsWith('/superadmin');
  const isAccessingFromSuperadminHost = isSuperadminHost();
  const requiresAuth = to.meta.requiresAuth;
  const currentTenant = getCurrentTenant();
  const storedTenant = authService.getTenant();

  // Update page title
  const titleKey = to.meta.titleKey as string | undefined;
  const pageTitle = titleKey ? i18n.global.t(titleKey) : i18n.global.t('app.name');
  document.title = `${pageTitle} | ${i18n.global.t('app.name')}`;

  // Prevent accessing wrong login routes
  const isTenantAuthRoute = to.name === 'Login' || to.name === 'Register';
  if (isAccessingFromSuperadminHost && isTenantAuthRoute) {
    next({ name: 'SuperadminLogin' });
    return;
  }
  if (!isAccessingFromSuperadminHost && to.name === 'SuperadminLogin' && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  if (isAccessingFromSuperadminHost) {
    if (!isAuthenticated) {
      if (to.name !== 'SuperadminLogin') {
        next({ name: 'SuperadminLogin' });
      } else {
        next();
      }
      return;
    }

    // If authenticated but not as superadmin, invalid state - clear and redirect
    if (user?.role !== 'superadmin') {
      authService.clearAuth();
      next({ name: 'SuperadminLogin' });
      return;
    }

    // If trying to access tenant routes, redirect to superadmin dashboard
    if (!isSuperadminRoute && requiresAuth) {
      next({ name: 'SuperadminDashboard' });
      return;
    }

    next();
    return;
  }

  // If subdomain changed, clear session
  if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  // If superadmin somehow on tenant host, clear and redirect
  if (isAuthenticated && user?.role === 'superadmin') {
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  // If trying to access superadmin routes, redirect appropriately
  if (isSuperadminRoute) {
    next({ name: isAuthenticated ? 'UserMapView' : 'Login' });
    return;
  }

  // If not authenticated and route requires it, redirect to login
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  // Role-based access control.
  // Supports both `meta.allowedRoles` (preferred) and legacy `meta.requiresAdmin`.
  const allowedRoles = (to.meta.allowedRoles as string[] | undefined) ??
    ((to.meta.requiresAdmin as boolean | undefined) ? ['admin', 'superadmin'] : undefined);

  if (allowedRoles?.length) {
    // At this point, unauthenticated users were already redirected above.
    if (!user || !hasAllowedRole(user.role, allowedRoles)) {
      next({ name: 'Unauthorized' });
      return;
    }
  }

  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    next({ name: 'UserMapView' });
    return;
  }

  next();
});

export default router;
