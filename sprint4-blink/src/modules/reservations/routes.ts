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
];