import type { RouteRecordRaw } from 'vue-router';

export const usersRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/users',
    name: 'Users',
    component: () => import('./views/UsersView.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'users.title',
    },
  },
];
