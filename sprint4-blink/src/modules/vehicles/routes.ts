import type { RouteRecordRaw } from 'vue-router';

export const vehiclesRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/vehicles',
    name: 'Vehicles',
    component: () => import('./views/VehiclesView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      allowedRoles: ['admin', 'superadmin'],
      titleKey: 'vehicles.title',
    },
  },
];
