import type { RouteRecordRaw } from 'vue-router';

export const reservationsRoutes: RouteRecordRaw[] = [
  {
    path: '/mis-reservas',
    name: 'MyReservations',
    component: () => import('./views/MyReservationsView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'reservations.title',
    },
  },
  {
    path: '/admin/reservations',
    name: 'AdminReservations',
    component: () => import('./views/AdminReservationsView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      allowedRoles: ['admin', 'superadmin'],
      titleKey: 'reservations.title',
    },
  },
];