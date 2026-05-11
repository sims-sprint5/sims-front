import { computed, onMounted, ref} from 'vue';
import { useI18n } from 'vue-i18n';

import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { createDefaultReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { applyReservationFilters, getReservationFacets } from '@/modules/reservations/utils/reservationFilters';
import { useTranslateError } from '@/shared/composables/useTranslateError';

// Debug flags: can be enabled via Vite env vars `VITE_DEBUG_VEHICLE_STATE` and `VITE_DEBUG_API_RESPONSE`
const DEBUG_VEHICLE_STATE: boolean = ((import.meta as any)?.env?.VITE_DEBUG_VEHICLE_STATE === 'true');
const DEBUG_API_RESPONSE: boolean = ((import.meta as any)?.env?.VITE_DEBUG_API_RESPONSE === 'true');

const NON_BLOCKING_RESERVATION_STATES = new Set(['cancelled', 'canceled', 'completed', 'finished', 'expired']);

/**
 * Safely parse and validate a date string
 * @returns Date object or null if invalid
 */
function parseDate(dateString: any): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      if (DEBUG_VEHICLE_STATE) console.warn(`[parseDate] Invalid date: ${dateString}`);
      return null;
    }
    return date;
  } catch (e) {
    if (DEBUG_VEHICLE_STATE) console.warn(`[parseDate] Parse error: ${dateString}`, e);
    return null;
  }
}

/**
 * Determine vehicle state at a specific point in time.
 * Single source of truth for vehicle availability logic.
 * 
 * @param v - Vehicle object
 * @param now - Current timestamp (shared across all calls to ensure consistency)
 * @returns Object with computed state
 */
function getVehicleState(v: Vehicle, now: Date) {
  const statusKey = (v.status ?? '').trim().toLowerCase();
  
  // Check if vehicle is unavailable due to status
  if (statusKey === 'maintenance' || statusKey === 'inactive' || statusKey === 'out_of_service' || statusKey === 'rented') {
    if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] ❌ Unavailable due to status: ${statusKey}`);
    return {
      isReservedNow: false,
      isAvailableNow: false,
      reason: `status_${statusKey}`,
    };
  }

  // Priority 1: Check calendar_reservations (most reliable real-time source)
  if (Array.isArray(v.calendar_reservations) && v.calendar_reservations.length > 0) {
    for (let i = 0; i < v.calendar_reservations.length; i += 1) {
      const reservation = v.calendar_reservations[i];
      if (!reservation) continue;
      
      const resStatusKey = String(reservation.status ?? '').trim().toLowerCase();
      const calendarStateKey = String(reservation.calendar_state ?? '').trim().toLowerCase();
      
      // Skip non-blocking states
      if (NON_BLOCKING_RESERVATION_STATES.has(resStatusKey) || NON_BLOCKING_RESERVATION_STATES.has(calendarStateKey)) {
        if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] ⊘ Reservation ${i} is non-blocking (${resStatusKey}/${calendarStateKey})`);
        continue;
      }

      const endDate = parseDate(reservation.end_date);
      
      if (!endDate) {
        if (DEBUG_VEHICLE_STATE) console.warn(`[${v.id}] ⚠️ Invalid end_date in calendar_reservations[${i}]:`, reservation.end_date);
        continue;
      }

      // Check if reservation is active (now is before end_date)
      if (now < endDate) {
        if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] 🔴 RESERVED by calendar_reservations[${i}] until ${endDate.toISOString()}`);
        return {
          isReservedNow: true,
          isAvailableNow: false,
          reason: 'calendar_reservation_active',
        };
      }
    }
  }

  // Priority 2: Check explicit reserved status (strong signal)
  if (statusKey === 'reserved') {
    if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] 🔴 Status is 'reserved'`);
    return {
      isReservedNow: true,
      isAvailableNow: false,
      reason: 'status_reserved',
    };
  }

  // Priority 3: Check next_reservation (for future-looking reservations)
  const nextResEnd = parseDate(v.next_reservation?.end_date);
  if (nextResEnd && now < nextResEnd) {
    if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] 🔴 Reserved by next_reservation until ${nextResEnd.toISOString()}`);
    return {
      isReservedNow: true,
      isAvailableNow: false,
      reason: 'next_reservation_active',
    };
  }

  // Priority 4: Check explicit available flag BEFORE next_available_at
  // If backend says it's available, trust that over a future next_available_at
  if (typeof v.available === 'boolean') {
    if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] ${v.available ? '🟢' : '⚠️'} Available flag: ${v.available} (taking precedence)`);
    return {
      isReservedNow: false,
      isAvailableNow: v.available,
      reason: v.available ? 'available_flag_true' : 'available_flag_false',
    };
  }

  // Priority 5: Check next_available_at (only if no explicit available flag)
  const nextAvailableAt = parseDate(v.next_available_at);
  if (nextAvailableAt && now < nextAvailableAt) {
    if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] 🔴 Blocked by next_available_at until ${nextAvailableAt.toISOString()}`);
    return {
      isReservedNow: true,
      isAvailableNow: false,
      reason: 'next_available_at_blocking',
    };
  }

  // Default: Available
  if (DEBUG_VEHICLE_STATE) console.log(`[${v.id}] 🟢 Default available`);
  return {
    isReservedNow: false,
    isAvailableNow: true,
    reason: 'default_available',
  };
}

/**
 * Convert vehicle to card model (for UI display)
 * Uses a single timestamp to ensure consistency
 */
function toCardModel(v: Vehicle, now: Date): ReservationVehicleCardModel {
  const state = getVehicleState(v, now);
  const name = [v.brand, v.model].filter(Boolean).join(' ').trim() || v.license_plate || '—';
  const category = state.isReservedNow ? 'reserved' : (state.isAvailableNow ? 'available' : (v.status || '—'));

  const description = v.color ? `Color: ${v.color}` : '';

  if (DEBUG_VEHICLE_STATE && (state.reason.includes('next_available_at') || state.reason.includes('calendar'))) {
    console.log(`[toCardModel] Vehicle ${v.id}: reason=${state.reason}, now=${now.toISOString()}, reserved=${state.isReservedNow}`);
  }

  return {
    id: v.id,
    name,
    category,
    status: v.status,
    licensePlate: v.license_plate,
    brand: v.brand,
    model: v.model,
    available: state.isAvailableNow,
    nextAvailableAt: v.next_available_at ?? null,
    calendarReservations: (() => {
      const slots = Array.isArray(v.calendar_reservations)
        ? v.calendar_reservations.map((reservation) => ({
            startDate: reservation.start_date,
            endDate: reservation.end_date,
            userName: reservation.user_name,
            status: reservation.status,
          }))
        : [];
      // If the vehicle is reserved via next_reservation but calendar_reservations is empty,
      // add next_reservation as a synthetic slot so the calendar shows occupied dates.
      if (v.next_reservation?.start_date && v.next_reservation?.end_date) {
        const alreadyCovered = slots.some(
          (s) => s.startDate === v.next_reservation!.start_date && s.endDate === v.next_reservation!.end_date,
        );
        if (!alreadyCovered) {
          slots.push({
            startDate: v.next_reservation.start_date,
            endDate: v.next_reservation.end_date,
            userName: v.next_reservation.user_name,
            status: undefined,
          });
        }
      }
      return slots;
    })(),
    description,
    specs: {
      seatsLabel: v.license_plate ? `License: ${v.license_plate}` : undefined,
      transmissionLabel: undefined,
      acLabel: v.color ? `Color: ${v.color}` : undefined,
      minAgeLabel: undefined,
    },
    features: description ? [description] : [],
    pricing: {
      fromLabel: 'STATUS',
      pricePerDay: v.status || '—',
      totalLabel: 'ID',
      total: String(v.vehicle_id ?? v.id),
    },
  };
}

export function useReservationVehicles() {
  const { t } = useI18n();
  const { translateErrorMessage } = useTranslateError();

  const vehicles = ref<Vehicle[]>([]);
  const vehiclesLoadedAt = ref<Date>(new Date()); // Capture timestamp once when loading
  const loading = ref<boolean>(true);
  const error = ref<string>('');
  let isLoadingInProgress = false; // Prevent parallel loads

  const filters = ref<ReservationFilters>(createDefaultReservationFilters());

  const facets = computed(() => getReservationFacets(vehicles.value));

  const filteredVehicles = computed(() => {
    return applyReservationFilters(vehicles.value, filters.value);
  });

  /**
   * Compute vehicle cards with synchronized timestamp captured at load time.
   * This prevents inconsistencies from multiple computed re-evaluations.
   */
  const vehicleCards = computed<ReservationVehicleCardModel[]>(() => {
    const now = vehiclesLoadedAt.value; // Use captured timestamp, don't create new ones
    const cards = filteredVehicles.value.map((vehicle) => toCardModel(vehicle, now));
    
    if (DEBUG_VEHICLE_STATE) {
      const reserved = cards.filter(c => c.category === 'reserved').length;
      const available = cards.filter(c => c.available).length;
      const other = cards.length - reserved - available;
      console.log(`[vehicleCards] Summary: ${reserved} reserved, ${available} available, ${other} other (total: ${cards.length})`);
      
      if (reserved === cards.length && cards.length > 0) {
        console.error(`⚠️ BUG DETECTED: ALL ${cards.length} VEHICLES MARKED AS RESERVED!`);
        console.log('Full vehicle data:', filteredVehicles.value);
        console.log('Timestamp used for comparison:', now.toISOString());
      }
    }
    
    return cards;
  });

  async function loadVehicles() {
    // Prevent parallel loads from overwriting each other's timestamps
    if (isLoadingInProgress) {
      if (DEBUG_API_RESPONSE) console.warn('[LoadVehicles] Load already in progress, ignoring duplicate call');
      return;
    }
    
    isLoadingInProgress = true;
    loading.value = true;
    error.value = '';
    const evaluationTimestamp = new Date(); // Capture IMMEDIATELY, before any async calls
    const loadStart = new Date();
    
    try {
      const allVehicles: Vehicle[] = [];
      let page = 1;
      const pageLog: any[] = [];

      while (true) {
        const pageStart = Date.now();
        const response = await vehicleService.getVehiclesCalendar(page, 200);
        const pageLoadTime = Date.now() - pageStart;
        const current = Array.isArray(response?.data) ? response.data : [];
        
        // ANOMALY DETECTION: Check if ALL vehicles have next_available_at in future
        if (current.length > 0) {
          const allHaveFutureNextAvailable = current.every(v => {
            const nextAvail = parseDate(v.next_available_at);
            return nextAvail && evaluationTimestamp < nextAvail;
          });
          
          if (allHaveFutureNextAvailable) {
            console.error(`⚠️ ANOMALY: ALL ${current.length} vehicles on page ${page} have next_available_at in the future!`);
          }
        }
        
        if (DEBUG_API_RESPONSE) {
          console.log(`[LoadVehicles] Page ${page}:`, {
            vehicleCount: current.length,
            loadTimeMs: pageLoadTime,
            lastPage: response?.meta?.last_page,
            evaluationTimestamp: evaluationTimestamp.toISOString(),
            sampleVehicle: current[0] ? {
              id: current[0].id,
              status: current[0].status,
              available: current[0].available,
              next_available_at: current[0].next_available_at,
              calendarReservationsCount: Array.isArray(current[0].calendar_reservations) ? current[0].calendar_reservations.length : 0,
              nextReservation: current[0].next_reservation ? `ends: ${current[0].next_reservation.end_date}` : 'null',
            } : 'NO VEHICLES',
          });
        }
        
        allVehicles.push(...current);
        pageLog.push({
          page,
          count: current.length,
          loadTimeMs: pageLoadTime,
        });

        const lastPage = Number(response?.meta?.last_page ?? 0);
        if (lastPage > 0) {
          if (page >= lastPage) break;
        } else if (current.length < 200) {
          break;
        }

        page += 1;
      }

      if (DEBUG_API_RESPONSE) {
        console.log(`[LoadVehicles] Loaded ${allVehicles.length} total vehicles in ${Date.now() - loadStart.getTime()}ms`, {
          pages: pageLog,
          evaluationTimestamp: evaluationTimestamp.toISOString(),
          reservedCount: allVehicles.filter(v => isVehicleReservedNowDebug(v, evaluationTimestamp)).length,
          availableCount: allVehicles.filter(v => !isVehicleReservedNowDebug(v, evaluationTimestamp) && isVehicleAvailableNowDebug(v, evaluationTimestamp)).length,
        });
      }

      vehicles.value = allVehicles;
      vehiclesLoadedAt.value = evaluationTimestamp; // Use the captured timestamp from load start
    } catch (e: any) {
      console.error('[LoadVehicles] Error:', e);
      error.value = translateErrorMessage(e?.message, t('vehicles.errors.load'));
      vehicles.value = [];
    } finally {
      loading.value = false;
      isLoadingInProgress = false;
    }
  }

  // Helper functions for debugging vehicle state
  function isVehicleReservedNowDebug(v: Vehicle, now: Date): boolean {
    const state = getVehicleState(v, now);
    return state.isReservedNow;
  }

  function isVehicleAvailableNowDebug(v: Vehicle, now: Date): boolean {
    const state = getVehicleState(v, now);
    return state.isAvailableNow;
  }

  function resetFilters() {
    filters.value = createDefaultReservationFilters();
  }

  onMounted(() => {
    loadVehicles();
  });
  
  return {
    vehicleCards,
    facets,
    filters,
    loading,
    error,
    resetFilters,
    reloadVehicles: loadVehicles,
  };
}