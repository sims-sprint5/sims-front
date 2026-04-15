<template>
  <div :class="sidebarClasses">
    <div class="flex h-20 shrink-0 items-center justify-center">
      <img :class="logoClasses" :src="blinkLogoDark" :alt="t('common.logoAlt', { app: t('app.name') })" />
    </div>

    <nav class="relative flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7 items-center">

        <!-- Superadmin Navigation -->
        <li v-if="isSuperadmin" class="w-full">
          <div v-if="!isCollapsed" class="text-xs/6 font-semibold text-muted px-2 mb-2">
            {{ t('superadmin.title') }}
          </div>
          <ul role="list" class="space-y-1 flex flex-col items-center">
            <li v-for="item in superadminNavigation" :key="item.nameKey" class="w-full flex justify-center">
              <RouterLink :to="item.href" :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)">
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />
                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <li v-if="isRegularUser || isAdmin" class="w-full">
          <div v-if="!isCollapsed" class="text-xs/6 font-semibold text-muted px-2 mb-2">
            {{ t('nav.sections.client') }}
          </div>
          <ul role="list" class="space-y-1 flex flex-col items-center">
            <li v-for="item in clienteNavigation" :key="item.nameKey" class="w-full flex justify-center">
              <RouterLink :to="item.href" :title="isCollapsed ? t(item.nameKey) : undefined"
                :class="getItemClasses(item)">
                <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />
                <span v-if="!isCollapsed" class="truncate">
                  {{ t(item.nameKey) }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <li v-if="isAdmin" class="w-full">
          <div v-if="!isCollapsed" class="text-xs/6 font-semibold text-muted px-2 mb-2">
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
                  class="ml-auto w-9 min-w-max rounded-full bg-surface-inverse px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-inverse">
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
                  class="ml-auto w-9 min-w-max rounded-full bg-surface-inverse px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-inverse">
                  {{ item.count }}
                </span>

                <span v-if="isCollapsed && item.count"
                  class="absolute right-1 top-1 block size-2 rounded-full bg-primary-500" />
              </RouterLink>
            </li>
          </ul>
        </li>

      </ul>

      <!-- Theme Switcher -->
      <div class="w-full flex justify-center mt-auto mb-4">
        <button
          @click="toggleTheme"
          :title="isCollapsed ? t('common.themeToggle') : undefined"
          :class="[
            'text-muted hover:bg-surface-muted hover:text-main',
            'group relative flex items-center font-semibold rounded-md transition-colors',
            isCollapsed ? 'h-10 w-10 justify-center' : 'w-full gap-x-3 p-2 text-sm/6'
          ]"
        >
          <!-- Sun Icon for Dark Mode -->
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <!-- Moon Icon for Light Mode -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>

          <span v-if="!isCollapsed" class="truncate">
            {{ isDark ? t('common.lightMode') : t('common.darkMode') }}
          </span>
        </button>
      </div>

      <!-- Logout button -->
      <div class="w-full flex justify-center mb-6">
        <button
          @click="handleLogout"
          :title="isCollapsed ? t('common.logout') : undefined"
          :class="[
            'text-red-400 hover:bg-red-500/10 hover:text-red-300',
            'group relative flex items-center font-semibold rounded-md transition-colors',
            isCollapsed ? 'h-10 w-10 justify-center' : 'w-full gap-x-3 p-2 text-sm/6'
          ]"
        >
          <!-- Exit door icon -->
          <svg
            class="size-6 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
            <polyline points="17 16 21 12 17 8" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span v-if="!isCollapsed" class="truncate">
            {{ t('common.logout') }}
          </span>
        </button>
      </div>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type Component } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUser } from '@/modules/auth/composables/useUser'
import { authService } from '@/modules/auth/services/auth.service'
import { superadminAuthService } from '@/modules/superadmin/services/superadmin-auth.service'
import { isAdminRole } from '@/shared/utils/roleUtils'
import { useTheme } from '@/shared/composables/useTheme'
import {
  Cog6ToothIcon,
  HomeIcon,
  MapPinIcon,
  TicketIcon,
  TruckIcon,
  UsersIcon,
  BuildingOffice2Icon,
} from '@heroicons/vue/24/outline'
import blinkLogoDark from '@/assets/fleetly_isotip_blanc.svg'

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
      h('svg', {
        ...attrs,
        class: [(attrs as any).class],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
      }, [
        h('path', { d: 'M6 9h12M6 9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3M6 9v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9M9 13h6' })
      ])
  },
})

const props = defineProps<{
  isCollapsed: boolean
}>()

const route = useRoute()
const { t } = useI18n()
const { user, clearAvatar } = useUser()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const isAdmin = computed(() => isAdminRole(user.value?.role) && user.value?.role !== 'superadmin')
const isSuperadmin = computed(() => user.value?.role === 'superadmin')
const isRegularUser = computed(() => user.value?.role === 'user')

const sidebarClasses = computed(() => [
  props.isCollapsed ? 'w-20 px-3' : 'w-72 px-6',
  'dark',
  'relative flex grow flex-col gap-y-5 overflow-y-auto bg-surface border-r border-default',
  'transition-[width,padding] duration-200 ease-in-out',
])

const logoClasses = computed(() => [
  'bg-transparent p-0 transition-all duration-200 shadow-none',
  props.isCollapsed ? 'size-9' : 'h-12'
])

const navLinkClasses = computed(() => [
  'text-muted hover:bg-surface-muted hover:text-main',
  'group relative flex items-center font-semibold rounded-md transition-colors',
  props.isCollapsed ? 'h-10 w-10 justify-center' : 'w-full gap-x-3 p-2 text-sm/6'
])

const getItemClasses = (item: NavItem) => {
  const classes = [...navLinkClasses.value]
  if (route.path === item.href) {
    classes.push('!bg-primary/10', '!text-primary')
  } else {
    classes.push('!bg-transparent', '!text-muted')
  }
  return classes.join(' ')
}

const clienteNavigation = computed<NavItem[]>(() => [
  { nameKey: 'nav.map', href: '/mapa', icon: MapPinIcon },
  { nameKey: 'nav.myReservations', href: '/mis-reservas', icon: ReservesIcon },
  { nameKey: 'nav.tickets', href: '/user/tickets', icon: TicketIcon },
  { nameKey: 'nav.settings', href: '/settings', icon: Cog6ToothIcon },
])

const adminNavigation = computed<NavItem[]>(() => [
  { nameKey: 'nav.users', href: '/admin/users', icon: UsersIcon },
  { nameKey: 'nav.vehicles', href: '/admin/vehicles', icon: TruckIcon },
  { nameKey: 'nav.reservationsAdmin', href: '/admin/reservations', icon: ReservesIcon },
  { nameKey: 'nav.geofencing', href: '/geofencing', icon: MapPinIcon },
  { nameKey: 'nav.tickets', href: '/admin/tickets', icon: TicketIcon },
])

const superadminNavigation = computed<NavItem[]>(() => [
  { nameKey: 'nav.dashboard', href: '/superadmin/dashboard', icon: HomeIcon },
  { nameKey: 'tenants.title', href: '/superadmin/tenants', icon: BuildingOffice2Icon },
  { nameKey: 'superadmin.admins.title', href: '/superadmin/admins', icon: UsersIcon },
])

const handleLogout = async () => {
  clearAvatar()
  const storedUser = authService.getUser()
  if (storedUser?.role === 'superadmin') {
    await superadminAuthService.logout()
    await router.push('/superadmin/login')
  } else {
    await authService.logout()
    await router.push('/login')
  }
}
</script>
