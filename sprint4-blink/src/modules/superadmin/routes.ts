import type { RouteRecordRaw } from 'vue-router';

export const superadminRoutes: RouteRecordRaw[] = [
    {
        path: '/superadmin/login',
        name: 'SuperadminLogin',
        component: () => import('./views/SuperadminLoginView.vue'),
        meta: {
            requiresAuth: false,
            titleKey: 'superadmin.title',
        },
    },
    {
        path: '/superadmin/dashboard',
        name: 'SuperadminDashboard',
        component: () => import('./views/SuperadminDashboardView.vue'),
        meta: {
            requiresAuth: true,
            requiresRole: 'superadmin',
            titleKey: 'superadmin.title',
        },
    },
];