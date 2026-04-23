import type { RouteRecordRaw } from 'vue-router';

export const ticketsRoutes: RouteRecordRaw[] = [
  {
    path: '/user/tickets',
    name: 'UserTickets',
    component: () => import('./views/TicketsView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'tickets.title',
    },
  },
  {
    path: '/admin/tickets',
    name: 'AdminTickets',
    component: () => import('./views/AdminTicketsView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      allowedRoles: ['admin', 'superadmin'],
      titleKey: 'adminTickets.title',
    },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('./views/ChatView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'nav.chat',
    },
  },
];
