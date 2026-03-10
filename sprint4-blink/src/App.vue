<script setup lang="ts">
import { onMounted } from 'vue';
import BaseToast from './components/base/BaseToast.vue';
import { authService } from './modules/auth/services/auth.service';
import { getCurrentTenant } from './shared/utils/tenantUtils';
import router from './router';

/**
 * PHASE 3: Inicialización con validación de tenant
 * Ejecuta en onMounted para sincronizar sesión según el subdominio actual
 */
onMounted(() => {
  // Si el usuario tiene una sesión activa, verificar que el tenant
  // del subdominio coincida con el tenant almacenado
  if (authService.isAuthenticated()) {
    const currentTenant = getCurrentTenant();
    const storedTenant = authService.getTenant();

    // Si el tenant no coincide, limpiar la sesión y redirigir al login
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

