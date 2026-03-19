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
    path: '/confirmar-reserva',
    name: 'ReservationConfirm',
    component: () => import('./views/ReservationConfirmPage.vue'),
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
      allowedRoles: ['admin', 'superadmin'],
      titleKey: 'reservations.title',
    },
  },
];