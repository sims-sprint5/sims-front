import { apiClient } from '@/shared/services/api.service';

interface CreateReservationCheckoutPayload {
  vehicleId: number | string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

interface CheckoutSessionResponse {
  checkout_url: string;
  stripe_session_id: string;
}

export interface ReservationCheckoutSession {
  checkoutUrl: string;
  stripeSessionId: string;
}

export async function createReservationCheckoutSession(
  payload: CreateReservationCheckoutPayload,
): Promise<ReservationCheckoutSession> {
  const normalizedVehicleId = Number(payload.vehicleId);

  if (!Number.isFinite(normalizedVehicleId) || normalizedVehicleId <= 0) {
    throw new Error('Invalid vehicle id');
  }

  if (!payload.startDate || !payload.endDate) {
    throw new Error('Missing reservation dates');
  }

  const pickupLocation = String(payload.pickupLocation ?? '').trim() || 'Ubicacion por confirmar';
  const dropoffLocation = String(payload.dropoffLocation ?? '').trim() || pickupLocation;

  // apiClient already prefixes requests with /api, so endpoint starts at /v1.
  const response = await apiClient.post<CheckoutSessionResponse>('/v1/reservations/checkout', {
    vehicle_id: normalizedVehicleId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
  });

  const checkoutUrl = response?.checkout_url;
  const stripeSessionId = response?.stripe_session_id;

  if (!checkoutUrl || typeof checkoutUrl !== 'string') {
    throw new Error('Missing checkout URL');
  }

  if (!stripeSessionId || typeof stripeSessionId !== 'string') {
    throw new Error('Missing Stripe session id');
  }

  return {
    checkoutUrl,
    stripeSessionId,
  };
}
