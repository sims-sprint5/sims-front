import type { RouteRecordRaw } from 'vue-router';

export const reservationsRoutes: RouteRecordRaw[] = [
  {
    path: '/reservation',
    name: 'ReservationPage',
    component: () => import('./views/ReservationPage.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'nav.bookings',
    },
  },
  {
    path: '/admin/reservations',
    name: 'AdminReservations',
    component: () => import('./views/AdminReservationsView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      titleKey: 'reservations.title',
    },
  },
];