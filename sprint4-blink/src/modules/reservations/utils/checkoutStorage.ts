export interface PendingReservationCheckout {
  vehicleId: number;
  startDate: string;
  endDate: string;
  stripeSessionId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'pendingReservationCheckout';
const LEGACY_STORAGE_KEY = 'pending_reservation_checkout';

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function normalizePayload(raw: Partial<PendingReservationCheckout>): PendingReservationCheckout | null {
  const vehicleId = Number(raw.vehicleId);
  if (!Number.isFinite(vehicleId) || !raw.startDate || !raw.endDate) {
    return null;
  }

  return {
    vehicleId,
    startDate: String(raw.startDate),
    endDate: String(raw.endDate),
    stripeSessionId: raw.stripeSessionId ? String(raw.stripeSessionId) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
  };
}

export function savePendingReservationCheckout(payload: PendingReservationCheckout): void {
  if (!hasWindow()) return;

  try {
    const serialized = JSON.stringify(payload);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    window.sessionStorage.setItem(LEGACY_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function getPendingReservationCheckout(): PendingReservationCheckout | null {
  if (!hasWindow()) return null;

  try {
    const primary = window.sessionStorage.getItem(STORAGE_KEY);
    const legacy = window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
    const raw = primary ?? legacy;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingReservationCheckout>;
    return normalizePayload(parsed);
  } catch {
    return null;
  }
}

export function clearPendingReservationCheckout(): void {
  if (!hasWindow()) return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
