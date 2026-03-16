import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authService } from '../modules/auth/services/auth.service';
import { getCurrentTenant, isSuperadminHost } from '../shared/utils/tenantUtils';
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
    redirect: () => (isSuperadminHost() ? '/superadmin/login' : '/login'),
  },
  ...authRoutes,
  ...dashboardRoutes,
  ...settingsRoutes,
  ...usersRoutes,
  ...ticketsRoutes,
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
  const storedUser = authService.getUser();
  const isSuperadminRoute = to.path.startsWith('/superadmin');
  const requiresAuth = to.meta.requiresAuth;
  const isAccessingFromSuperadminHost = isSuperadminHost();

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
    if (storedUser?.role !== 'superadmin') {
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

  // Tenant context ({tenant}.lvh.me)
  const currentTenant = getCurrentTenant();
  const storedTenant = authService.getTenant();

  // If subdomain changed, clear session
  if (isAuthenticated && storedTenant && currentTenant !== storedTenant) {
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  // If superadmin somehow on tenant host, clear and redirect
  if (isAuthenticated && storedUser?.role === 'superadmin') {
    authService.clearAuth();
    next({ name: 'Login' });
    return;
  }

  // If trying to access superadmin routes, redirect appropriately
  if (isSuperadminRoute) {
    next({ name: isAuthenticated ? 'Dashboard' : 'Login' });
    return;
  }

  // If not authenticated and route requires it, redirect to login
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  // If already authenticated on login/register, redirect to dashboard
  if (isTenantAuthRoute && isAuthenticated) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
