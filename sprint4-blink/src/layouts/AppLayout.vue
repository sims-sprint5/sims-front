<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30 flex">
    <aside class="shrink-0 h-screen sticky top-0">
      <Sidebar :is-collapsed="isCollapsed" class="h-full" />
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">

      <Navbar :title="title" @toggle-menu="toggleSidebar" @logout="handleLogout" />

      <main class="flex-1 overflow-y-auto bg-transparent">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/modules/auth/services/auth.service';
import { superadminAuthService } from '@/modules/superadmin/services/superadmin-auth.service';
import { useUser } from '@/modules/auth/composables/useUser';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
});

const router = useRouter();
const isCollapsed = ref(true);
const { loadUser, clearAvatar } = useUser();

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

onMounted(async () => {
  // Els superadmins usen un endpoint d'auth diferenciat (/v1/superadmin/auth/me).
  // Cridar /v1/auth/me amb el token de superadmin retornaria 401 i l'interceptor
  // d'axios faria un redirect forçat a /login, ignorant el try/catch.
  // Per als superadmins, les dades ja estan al localStorage des del login, és suficient.
  const storedUser = authService.getUser();
  if (storedUser?.role === 'superadmin') return;

  try {
    await loadUser();
  } catch (_err) {
    // Ignore error — user will see toast messages if needed
  }
});

const handleLogout = async () => {
  clearAvatar();
  const storedUser = authService.getUser();
  if (storedUser?.role === 'superadmin') {
    await superadminAuthService.logout();
    router.push('/superadmin/login');
  } else {
    await authService.logout();
    router.push('/login');
  }
};
</script>
