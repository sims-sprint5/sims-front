import type { ComposerTranslation } from 'vue-i18n';

/**
 * Statuses supported by the backend.
 * Keep aligned with the API to avoid invalid options in the form.
 */
export const VEHICLE_STATUS_OPTIONS = [
  'available',
  'reserved',
  'maintenance',
  'inactive',
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUS_OPTIONS)[number];

/**
 * Returns the translated label for a vehicle status.
 * Uses i18n (vehicles.status.*) and, if there is no translation, returns the original value.
 */
export function getVehicleStatusLabel(t: ComposerTranslation, status: unknown): string {
  const raw = String(status ?? '').trim();
  if (!raw) return '';

  const key = `vehicles.status.${raw.toLowerCase()}`;
  const translated = t(key);

  return translated === key ? raw : translated;
}

export function getVehicleStatusClass(status: unknown): string {
  const key = String(status ?? '').trim().toLowerCase();
  const classes: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800',
  };
  return classes[key] || 'bg-surface-muted text-main';
}
