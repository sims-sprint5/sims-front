import type { RouteRecordRaw } from 'vue-router'
import MapView from './views/MapView.vue'
import UserMapView from './views/UserMapView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/geofencing',
    name: 'GeofencingView',
    component: MapView,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      allowedRoles: ['admin', 'superadmin'],
      titleKey: 'mapa.title'
    }
  },
  {
    path: '/mapa',
    name: 'UserMapView',
    component: UserMapView,
    meta: {
      requiresAuth: true,
      titleKey: 'mapa.userTitle'
    }
  }
]

export default routes
