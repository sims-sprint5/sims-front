<template>
  <div :class="sidebarClasses">
    <div class="flex h-20 shrink-0 items-center justify-center">
      <img :class="logoClasses" :src="blinkLogo" :alt="t('common.logoAlt', { app: t('app.name') })" />
    </div>

    <nav class="relative flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7 items-center">

        <li class="w-full">
          <div v-if="!isCollapsed" class="text-xs/6 font-semibold text-gray-400 px-2 mb-2">
            {{ t('nav.sections.client') }}
          </div>
          <ul role="list" class="space-y-1 flex flex-col items-center">
            <li v-for="item in clienteNavigation" :key="item.nameKey" class="w-full flex justify-center">
              <button
                v-if="item.href === '#'"
                :disabled="true"
                :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)"
              >
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />

                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>

                <span v-if="!isCollapsed && item.count"
                  class="ml-auto w-9 min-w-max rounded-full bg-gray-900 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white">
                  {{ item.count }}
                </span>

                <span v-if="isCollapsed && item.count"
                  class="absolute right-1 top-1 block size-2 rounded-full bg-primary-500" />
              </button>
              
              <RouterLink
                v-else
                :to="item.href"
                :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)"
              >
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />

                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>

                <span v-if="!isCollapsed && item.count"
                  class="ml-auto w-9 min-w-max rounded-full bg-gray-900 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white">
                  {{ item.count }}
                </span>

                <span v-if="isCollapsed && item.count"
                  class="absolute right-1 top-1 block size-2 rounded-full bg-primary-500" />
              </RouterLink>
            </li>
          </ul>
        </li>

        <li class="w-full">
          <div v-if="!isCollapsed" class="text-xs/6 font-semibold text-gray-400 px-2 mb-2">
            {{ t('nav.sections.admin') }}
          </div>
          <ul role="list" class="space-y-1 flex flex-col items-center">
            <li v-for="item in adminNavigation" :key="item.nameKey" class="w-full flex justify-center">
              <button
                v-if="item.href === '#'"
                :disabled="true"
                :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)"
              >
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />

                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>

                <span v-if="!isCollapsed && item.count"
                  class="ml-auto w-9 min-w-max rounded-full bg-gray-900 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white">
                  {{ item.count }}
                </span>

                <span v-if="isCollapsed && item.count"
                  class="absolute right-1 top-1 block size-2 rounded-full bg-primary-500" />
              </button>
              
              <RouterLink
                v-else
                :to="item.href"
                :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)"
              >
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />

                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>

                <span v-if="!isCollapsed && item.count"
                  class="ml-auto w-9 min-w-max rounded-full bg-gray-900 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white">
                  {{ item.count }}
                </span>

                <span v-if="isCollapsed && item.count"
                  class="absolute right-1 top-1 block size-2 rounded-full bg-primary-500" />
              </RouterLink>
            </li>
          </ul>
        </li>

      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type Component } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Cog6ToothIcon,
  HomeIcon,
  MapPinIcon,
  TicketIcon,
  TruckIcon,
  UsersIcon,
  ChartPieIcon,
} from '@heroicons/vue/24/outline'
import blinkLogo from '@/assets/blink-logo.png'
import reservesImg from '@/assets/reserves.png'

type NavItem = {
  nameKey: string
  href: string
  icon: Component
  count?: string
}

const ReservesIcon = defineComponent({
  name: 'ReservesIcon',
  setup(_, { attrs }) {
    return () =>
      h('img', {
        ...attrs,
        src: reservesImg,
        alt: '',
        class: [
          (attrs as any).class,
          'brightness-0 invert',
        ],
      })
  },
})

const props = defineProps<{
  isCollapsed: boolean
}>()

const route = useRoute()
const { t } = useI18n()

const sidebarClasses = computed(() => [
  props.isCollapsed ? 'w-20 px-3' : 'w-72 px-6',
  'relative flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900',
  'transition-[width,padding] duration-200 ease-in-out',
])

const logoClasses = computed(() => [
  'bg-transparent p-0 transition-all duration-200 shadow-none',
  props.isCollapsed ? 'size-9' : 'h-12'
])

const navLinkClasses = computed(() => [
  'text-gray-400 hover:bg-white/5 hover:text-white',
  'group relative flex items-center font-semibold rounded-md transition-colors',
  props.isCollapsed ? 'h-10 w-10 justify-center' : 'w-full gap-x-3 p-2 text-sm/6'
])

const getItemClasses = (item: NavItem) => {
  const classes = [...navLinkClasses.value]
  if (route.path === item.href) {
    classes.push('!bg-transparent', '!text-gray-400')
  } else {
    classes.push('!bg-white/10', '!text-white')
  }
  return classes.join(' ')
}

const clienteNavigation = computed<NavItem[]>(() => [
  { nameKey: 'nav.dashboard', href: '/dashboard', icon: HomeIcon },
  { nameKey: 'nav.map', href: '/mapa', icon: MapPinIcon },
  { nameKey: 'nav.tickets', href: '/user/tickets', icon: TicketIcon },
  { nameKey: 'nav.bookings', href: '/reservation', icon: ReservesIcon },
  { nameKey: 'nav.settings', href: '/settings', icon: Cog6ToothIcon },
])

const adminNavigation = computed<NavItem[]>(() => [
  { nameKey: 'nav.users', href: '/admin/users', icon: UsersIcon },
  { nameKey: 'nav.vehicles', href: '/admin/vehicles', icon: TruckIcon },
  { nameKey: 'nav.reservationsAdmin', href: '/admin/reservations', icon: ReservesIcon },
  { nameKey: 'nav.geofencing', href: '#', icon: MapPinIcon },
  { nameKey: 'nav.users', href: '/users', icon: UsersIcon },
  { nameKey: 'nav.vehicles', href: '#', icon: TruckIcon, count: '12' },
  { nameKey: 'nav.bookings', href: '#', icon: ChartPieIcon },
  { nameKey: 'nav.geofencing', href: '/geofencing', icon: MapPinIcon },
  { nameKey: 'nav.tickets', href: '/admin/tickets', icon: TicketIcon },
])
</script>
