import type { CreateUserData, UpdateUserData } from '../types/user.types';
import type { ValidationErrors } from '@/shared/utils/validators';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateRole,
} from '@/shared/utils/validators';

export type { ValidationErrors } from '@/shared/utils/validators';

export function validateUserForm(
  formData: CreateUserData | UpdateUserData,
  isEditing: boolean = false
): ValidationErrors {
  const errors: ValidationErrors = {};

  const nameError = validateName(formData.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;

  const roleError = validateRole(formData.role);
  if (roleError) errors.role = roleError;

  const passwordData = formData as CreateUserData;
  if (passwordData.password !== undefined) {
    const passwordError = validatePassword(passwordData.password, isEditing);
    if (passwordError) errors.password = passwordError;

    const confirmError = validatePasswordConfirmation(
      passwordData.password,
      passwordData.password_confirmation || '',
      isEditing
    );
    if (confirmError) errors.password_confirmation = confirmError;
  }

  return errors;
}
