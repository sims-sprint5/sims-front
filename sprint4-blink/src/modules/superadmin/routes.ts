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
    {
        path: '/superadmin/tenants',
        name: 'SuperadminTenants',
        component: () => import('./views/TenantsView.vue'),
        meta: {
            requiresAuth: true,
            requiresRole: 'superadmin',
            titleKey: 'tenants.title',
        },
    },
    {
        path: '/superadmin/admins',
        name: 'SuperadminAdmins',
        component: () => import('./views/SuperadminsView.vue'),
        meta: {
            requiresAuth: true,
            requiresRole: 'superadmin',
            titleKey: 'superadmin.admins.title',
        },
    },
];