<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import VehicleCard from '@/modules/reservations/components/VehicleCard.vue';
import BasePagination from '@/components/base/BasePagination.vue';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';

interface Props {
  vehicles?: ReservationVehicleCardModel[];
  loading?: boolean;
  skeletonCount?: number;
  pageSize?: number;
}

const emit = defineEmits<{
  reserve: [vehicle: ReservationVehicleCardModel];
}>();

const props = withDefaults(defineProps<Props>(), {
  vehicles: () => [],
  loading: false,
  skeletonCount: 3,
  pageSize: 3,
});

const currentPage = ref(1);

watch(
  () => props.vehicles,
  () => { currentPage.value = 1; },
);

const pagination = computed(() => {
  const total = props.vehicles.length;
  if (total === 0) return null;
  const last_page = Math.max(1, Math.ceil(total / props.pageSize));
  const current = Math.min(Math.max(1, currentPage.value), last_page);
  const from = (current - 1) * props.pageSize + 1;
  const to = Math.min(total, current * props.pageSize);
  return { current_page: current, from, last_page, per_page: props.pageSize, to, total };
});

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return props.vehicles.slice(start, start + props.pageSize);
});

function handlePageChange(page: number) {
  currentPage.value = page;
}

function handleReserve(vehicle: ReservationVehicleCardModel) {
  emit('reserve', vehicle);
}
</script>

<template>
  <div class="space-y-4">
    <slot name="header" />

    <template v-if="loading">
      <VehicleCard v-for="i in skeletonCount" :key="i" skeleton />
    </template>

    <template v-else-if="vehicles.length">
      <slot name="items">
        <VehicleCard
          v-for="v in paginatedVehicles"
          :key="v.id"
          :vehicle="v"
          @reserve="handleReserve"
        />
      </slot>

      <BasePagination
        v-if="pagination"
        :pagination="pagination"
        @change="handlePageChange"
      />
    </template>

    <template v-else>
      <slot name="empty" />
    </template>
  </div>
</template>