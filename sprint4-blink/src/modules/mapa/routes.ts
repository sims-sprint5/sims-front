import type { RouteRecordRaw } from 'vue-router'
import MapView from './views/MapView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/mapa',
    name: 'MapView',
    component: MapView,
    meta: {
      requiresAuth: true,
      titleKey: 'mapa.title'
    }
  }
]

export default routes
