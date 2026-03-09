import type { CreateReservationData, UpdateReservationData } from '../types/reservation.types';
import type { ValidationErrors } from '@/shared/utils/validators';

export type { ValidationErrors } from '@/shared/utils/validators';

function validateRequiredNumber(value: unknown, key: string): string | null {
  if (value === null || value === undefined || value === '') return `validation.reservation.${key}.required`;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return `validation.reservation.${key}.invalid`;
  return null;
}

function validateRequiredText(value: unknown, key: string): string | null {
  if (typeof value !== 'string') return `validation.reservation.${key}.required`;
  if (!value.trim()) return `validation.reservation.${key}.required`;
  return null;
}

export function validateReservationForm(
  formData: CreateReservationData | UpdateReservationData,
  _isEditing: boolean = false,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const userIdError = validateRequiredNumber((formData as any).user_id, 'user_id');
  if (userIdError) (errors as any).user_id = userIdError;

  const vehicleIdError = validateRequiredNumber((formData as any).vehicle_id, 'vehicle_id');
  if (vehicleIdError) (errors as any).vehicle_id = vehicleIdError;

  const statusError = validateRequiredText((formData as any).status, 'status');
  if (statusError) (errors as any).status = statusError;

  const startError = validateRequiredText((formData as any).start_at, 'start_at');
  if (startError) (errors as any).start_at = startError;

  const endError = validateRequiredText((formData as any).end_at, 'end_at');
  if (endError) (errors as any).end_at = endError;

  return errors;
}
