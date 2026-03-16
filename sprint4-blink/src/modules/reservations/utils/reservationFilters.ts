import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function applyReservationFilters(vehicles: Vehicle[], filters: ReservationFilters): Vehicle[] {
  const q = normalizeText(filters.search);
  const status = normalizeText(filters.status);
  const brand = normalizeText(filters.brand);
  let yearFrom = filters.yearFrom ?? null;
  let yearTo = filters.yearTo ?? null;

  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }

  return vehicles.filter((v) => {
    if (q) {
      const haystack = [v.license_plate, v.brand, v.model].map(normalizeText).join(' ');
      if (!haystack.includes(q)) return false;
    }

    if (status) {
      if (normalizeText(v.status) !== status) return false;
    }

    if (brand) {
      if (normalizeText(v.brand) !== brand) return false;
    }

    if (yearFrom !== null) {
      if (v.year === null) return false;
      if (v.year < yearFrom) return false;
    }

    if (yearTo !== null) {
      if (v.year === null) return false;
      if (v.year > yearTo) return false;
    }

    return true;
  });
}

export function getReservationFacets(vehicles: Vehicle[]): {
  statuses: string[];
  brands: string[];
  yearMin: number | null;
  yearMax: number | null;
} {
  const statuses = Array.from(
    new Set(
      vehicles
        .map((v) => v.status)
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const brands = Array.from(
    new Set(
      vehicles
        .map((v) => v.brand)
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const years = vehicles
    .map((v) => (typeof v.year === 'number' ? v.year : null))
    .filter((y): y is number => y !== null);

  const yearMin = years.length ? Math.min(...years) : null;
  const yearMax = years.length ? Math.max(...years) : null;

  return { statuses, brands, yearMin, yearMax };
}