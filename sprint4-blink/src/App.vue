<script setup lang="ts">
import { onMounted } from 'vue';
import BaseToast from './components/base/BaseToast.vue';
import { authService } from './modules/auth/services/auth.service';
import { getCurrentTenant } from './shared/utils/tenantUtils';
import router from './router';

onMounted(() => {
  if (authService.isAuthenticated()) {
    const currentTenant = getCurrentTenant();
    const storedTenant = authService.getTenant();

    if (storedTenant && currentTenant !== storedTenant) {
      authService.clearAuth();
      router.push({ name: 'Login' });
    }
  }
});
</script>

<template>
  <router-view />
  <BaseToast />
</template>

