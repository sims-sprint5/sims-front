export type ReservationDebugEntry = {
  scope: string;
  timestamp: string;
  payload: unknown;
};

const DEBUG_QUERY_PARAM = 'debugReservations';
const DEBUG_STORAGE_KEY = 'debug_reservations';
const DEBUG_EVENT_NAME = 'reservation-debug-update';
const MAX_DEBUG_ENTRIES = 30;

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function getDebugBuffer(): ReservationDebugEntry[] {
  if (!hasWindow()) return [];
  const win = window as typeof window & {
    __reservationDebugBuffer__?: ReservationDebugEntry[];
  };

  if (!Array.isArray(win.__reservationDebugBuffer__)) {
    win.__reservationDebugBuffer__ = [];
  }

  return win.__reservationDebugBuffer__;
}

function readEnabledFromQuery(): boolean | null {
  if (!hasWindow()) return null;

  const params = new URLSearchParams(window.location.search);
  if (!params.has(DEBUG_QUERY_PARAM)) return null;

  const value = String(params.get(DEBUG_QUERY_PARAM) ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function persistDebugFlag(enabled: boolean): void {
  if (!hasWindow()) return;

  try {
    window.localStorage.setItem(DEBUG_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore localStorage write errors.
  }
}

export function isReservationDebugEnabled(): boolean {
  if (!hasWindow()) return false;

  const fromQuery = readEnabledFromQuery();
  if (fromQuery !== null) {
    persistDebugFlag(fromQuery);
    return fromQuery;
  }

  try {
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function pushReservationDebug(scope: string, payload: unknown): void {
  if (!isReservationDebugEnabled()) return;

  const entry: ReservationDebugEntry = {
    scope,
    timestamp: new Date().toISOString(),
    payload,
  };

  const buffer = getDebugBuffer();
  buffer.push(entry);

  if (buffer.length > MAX_DEBUG_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_DEBUG_ENTRIES);
  }

  // eslint-disable-next-line no-console
  console.info('[ReservationDebug]', scope, payload);

  window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME));
}

export function getReservationDebugSnapshot(): ReservationDebugEntry[] {
  return [...getDebugBuffer()];
}

export function clearReservationDebugSnapshot(): void {
  const buffer = getDebugBuffer();
  buffer.splice(0, buffer.length);

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME));
  }
}

export function getReservationDebugEventName(): string {
  return DEBUG_EVENT_NAME;
}
