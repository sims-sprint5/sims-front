import type { RouteRecordRaw } from 'vue-router';

export const usersRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'Users',
    component: () => import('./views/UsersView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'users.title',
    },
  },
];
