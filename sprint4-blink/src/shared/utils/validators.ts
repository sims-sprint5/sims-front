export interface ValidationErrors {
  [key: string]: string | undefined;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
}

export function validateName(name: string | undefined): string | null {
  if (!name || !name.trim()) {
    return 'validation.name.required';
  }
  if (name.trim().length < 2) {
    return 'validation.name.min';
  }
  if (name.trim().length > 100) {
    return 'validation.name.max';
  }
  return null;
}

export function validateEmail(email: string | undefined): string | null {
  if (!email || !email.trim()) {
    return 'validation.email.required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'validation.email.invalid';
  }
  
  if (email.length > 255) {
    return 'validation.email.max';
  }
  
  return null;
}

export function validatePhone(phone: string | undefined): string | null {
  if (!phone || !phone.trim()) {
    return 'validation.phone.required';
  }
  
  const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
  if (!phoneRegex.test(phone)) {
    return 'validation.phone.invalid';
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return 'validation.phone.minDigits';
  }
  
  return null;
}

export function validatePassword(password: string | undefined, isEditing: boolean = false): string | null {
  if (!isEditing && (!password || !password.trim())) {
    return 'validation.password.required';
  }
  
  if (password && password.trim().length < 8) {
    return 'validation.password.min';
  }
  
  if (password && password.trim().length > 255) {
    return 'validation.password.max';
  }
  
  return null;
}

export function validatePasswordConfirmation(
  password: string | undefined,
  passwordConfirmation: string | undefined,
  isEditing: boolean = false
): string | null {
  if (!isEditing && password && !passwordConfirmation) {
    return 'validation.passwordConfirmation.required';
  }
  
  if (password !== passwordConfirmation) {
    return 'validation.passwordMismatch';
  }
  
  return null;
}

export function validateRole(role: string | undefined): string | null {
  if (!role) {
    return 'validation.role.required';
  }
  
  const validRoles = ['user', 'admin', 'superadmin'];
  if (!validRoles.includes(role)) {
    return 'validation.role.invalid';
  }
  
  return null;
}


