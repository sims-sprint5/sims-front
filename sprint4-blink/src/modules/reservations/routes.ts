import type { RouteRecordRaw } from 'vue-router';

export const reservationsRoutes: RouteRecordRaw[] = [
  {
    path: '/reservation',
    name: 'ReservationPage',
    component: () => import('./views/ReservationPage.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'reservations.title',
    },
  },
  {
    path: '/reservation/:id/completed',
    name: 'ReservationCompleted',
    component: () => import('./views/ReservationCompletedView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'reservations.completed.title',
    },
  },
  // Eliminada la ruta de retorno de pago '/user/pago' — ahora usamos '/mis-reservas'
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