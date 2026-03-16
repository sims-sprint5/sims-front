import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authService } from '../modules/auth/services/auth.service';
import { getCurrentTenant, getCurrentContext } from '../shared/utils/tenantUtils';
import { authRoutes } from '../modules/auth/routes';
import { dashboardRoutes } from '../modules/dashboard/routes';
import { settingsRoutes } from '../modules/settings/routes';
import { usersRoutes } from '../modules/users/routes';
import { ticketsRoutes } from '../modules/tickets/routes';
import { superadminRoutes } from '../modules/superadmin/routes';
import { i18n } from '@/i18n';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: (to) => {
      // Redirect based on hostname context
      const { isSuperadmin } = getCurrentContext();
      return isSuperadmin ? '/superadmin/login' : '/login';
    },
  },
  ...authRoutes,
  ...dashboardRoutes,
  ...settingsRoutes,
  ...usersRoutes,
  ...ticketsRoutes,
  ...superadminRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      // Fallback redirect based on hostname context
      const { isSuperadmin } = getCurrentContext();
      return isSuperadmin ? '/superadmin/login' : '/login';
    },
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
 * - Separates superadmin (localhost) dashboard from tenant ({tenant}.lvh.me) dashboards
 * - Validates authentication based on hostname context
 * - Prevents invalid cross-context navigation
 */
router.beforeEach((to, _from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  const requiresAuth = to.meta.requiresAuth;
  const { isSuperadmin: isAccessingFromSuperadminHost } = getCurrentContext();
  const currentTenant = getCurrentTenant();
  const storedTenant = authService.getTenant();
  const storedUser = authService.getUser();
  const isSuperadminRoute = to.path.startsWith('/superadmin');

  // Update page title
  const titleKey = to.meta.titleKey as string | undefined;
  const pageTitle = titleKey ? i18n.global.t(titleKey) : i18n.global.t('app.name');
  document.title = `${pageTitle} | ${i18n.global.t('app.name')}`;

  // Separate routing logic based on hostname context
  if (isAccessingFromSuperadminHost) {
    // Superadmin context (localhost / 127.0.0.1)
    if (to.name === 'Login' || to.name === 'Register') {
      next({ name: 'SuperadminLogin' });
      return;
    }

    if (!isAuthenticated) {
      if (to.name === 'SuperadminLogin') {
        next();
        return;
      }
      next({ name: 'SuperadminLogin' });
      return;
    }

    if (storedUser?.role !== 'superadmin') {
      authService.clearAuth();
      next({ name: 'SuperadminLogin' });
      return;
    }

    if (!isSuperadminRoute && requiresAuth) {
      next({ name: 'SuperadminDashboard' });
      return;
    }

    next();
    return;
  } else {
    // Tenant context ({tenant}.lvh.me)
    if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
      authService.clearAuth();
      next({ name: 'Login' });
      return;
    }

    if (isAuthenticated && storedUser?.role === 'superadmin') {
      authService.clearAuth();
      next({ name: 'Login' });
      return;
    }

    if (isSuperadminRoute) {
      if (isAuthenticated) {
        next({ name: 'Dashboard' });
      } else {
        next({ name: 'Login' });
      }
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
    return;
  }
});

export default router;
