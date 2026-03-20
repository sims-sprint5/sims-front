import type { CreateVehicleData, UpdateVehicleData } from '../types/vehicle.types';
import type { ValidationErrors } from '@/shared/utils/validators';

export type { ValidationErrors } from '@/shared/utils/validators';

function validateRequiredText(value: unknown, key: string): string | null {
  if (typeof value !== 'string') return `validation.vehicle.${key}.required`;
  if (!value.trim()) return `validation.vehicle.${key}.required`;
  return null;
}

function validateYear(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return 'validation.vehicle.year.required';
  const year = Number(value);
  if (!Number.isFinite(year) || !Number.isInteger(year)) return 'validation.vehicle.year.invalid';
  if (year < 1900) return 'validation.vehicle.year.min';
  if (year > 2100) return 'validation.vehicle.year.max';
  return null;
}

function validateDecimalOrEmpty(value: unknown, key: 'current_latitude' | 'current_longitude'): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return `validation.vehicle.${key}.invalid`;
  return null;
}

function validateDecimalRequired(value: unknown, key: 'current_latitude' | 'current_longitude'): string | null {
  if (value === null || value === undefined || value === '') return `validation.vehicle.${key}.required`;
  const n = Number(value);
  if (!Number.isFinite(n)) return `validation.vehicle.${key}.invalid`;
  return null;
}

export function validateVehicleForm(
  formData: CreateVehicleData | UpdateVehicleData,
  isEditing: boolean = false,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const licensePlateError = validateRequiredText((formData as any).license_plate, 'license_plate');
  if (licensePlateError) (errors as any).license_plate = licensePlateError;

  const brandError = validateRequiredText((formData as any).brand, 'brand');
  if (brandError) (errors as any).brand = brandError;

  const modelError = validateRequiredText((formData as any).model, 'model');
  if (modelError) (errors as any).model = modelError;

  const yearError = validateYear((formData as any).year);
  if (yearError) (errors as any).year = yearError;

  const colorError = validateRequiredText((formData as any).color, 'color');
  if (colorError) (errors as any).color = colorError;

  const statusError = validateRequiredText((formData as any).status, 'status');
  if (statusError) (errors as any).status = statusError;

  const latError = isEditing
    ? validateDecimalOrEmpty((formData as any).current_latitude, 'current_latitude')
    : validateDecimalRequired((formData as any).current_latitude, 'current_latitude');
  if (latError) (errors as any).current_latitude = latError;

  const lngError = isEditing
    ? validateDecimalOrEmpty((formData as any).current_longitude, 'current_longitude')
    : validateDecimalRequired((formData as any).current_longitude, 'current_longitude');
  if (lngError) (errors as any).current_longitude = lngError;

  return errors;
}
