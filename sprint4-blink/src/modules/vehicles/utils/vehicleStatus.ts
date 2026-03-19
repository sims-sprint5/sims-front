import type { ComposerTranslation } from 'vue-i18n';

/**
 * Retorna l'etiqueta traduïda per a un status de vehicle.
 * Fa servir i18n (vehicles.status.*) i, si no hi ha traducció, retorna el valor original.
 */
export function getVehicleStatusLabel(t: ComposerTranslation, status: unknown): string {
  const raw = String(status ?? '').trim();
  if (!raw) return '';

  const key = `vehicles.status.${raw.toLowerCase()}`;
  const translated = t(key);

  return translated === key ? raw : translated;
}
