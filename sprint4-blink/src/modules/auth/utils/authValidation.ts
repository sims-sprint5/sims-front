import type { ValidationErrors } from '@/shared/utils/validators';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
} from '@/shared/utils/validators';

export type { ValidationErrors } from '@/shared/utils/validators';

export function validateLoginCredentials(email: string, password: string): ValidationErrors {
  const errors: ValidationErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password, false);
  if (passwordError) errors.password = passwordError;

  return errors;
}

export function validateRegisterData(
  name: string,
  email: string,
  phone: string,
  password: string,
  passwordConfirmation: string
): ValidationErrors {
  const errors: ValidationErrors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;

  const passwordError = validatePassword(password, false);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordConfirmation(password, passwordConfirmation, false);
  if (confirmError) errors.password_confirmation = confirmError;

  return errors;
}
