import type { RouteRecordRaw } from 'vue-router';

export const reservationsRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/reservations',
    name: 'Reservations',
    component: () => import('./views/ReservationsView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'reservations.title',
    },
  },
];
