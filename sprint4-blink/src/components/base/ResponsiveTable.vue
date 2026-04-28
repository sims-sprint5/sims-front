<template>
  <!-- Desktop: Tabla normal -->
  <div class="hidden md:block">
    <slot name="desktop" />
  </div>

  <!-- Mobile: Cards -->
  <div class="md:hidden space-y-4">
    <div v-if="loading" class="text-center py-8 text-muted">
      {{ loadingText }}
    </div>
    <div v-else-if="items.length === 0" class="text-center py-8 text-muted">
      {{ emptyText }}
    </div>
    <div v-else v-for="item in items" :key="getItemKey(item)" class="bg-surface rounded-lg border border-default p-4 shadow-sm">
      <slot name="card" :item="item" :getItemKey="getItemKey" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  items: any[];
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  keyField?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Cargando...',
  emptyText: 'Sin datos',
  keyField: 'id',
});

const getItemKey = (item: any): string | number => {
  const key = (item as any).keyField || item.id || Math.random();
  return key;
};
</script>
