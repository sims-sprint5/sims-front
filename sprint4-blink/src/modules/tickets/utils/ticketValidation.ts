import type { CreateTicketData } from '../types/ticket.types';
import type { ValidationErrors } from '@/shared/utils/validators';

export type { ValidationErrors } from '@/shared/utils/validators';

export function validateTicketForm(
  formData: CreateTicketData
): ValidationErrors {
  const errors: ValidationErrors = {};
  // Validar descripcion
  if (formData.descripcion) {
    if (typeof formData.descripcion !== 'string' || formData.descripcion.trim().length === 0) {
      errors.descripcion = 'validation.ticket.descripcionInvalid';
    } else if (formData.descripcion.length > 1000) {
      errors.descripcion = 'validation.ticket.descripcionMax';
    }
  }
  if (!formData.asunto || typeof formData.asunto !== 'string' || formData.asunto.trim().length === 0) {
    errors.asunto = 'validation.ticket.asuntoRequired';
  } else if (formData.asunto.length > 255) {
    errors.asunto = 'validation.ticket.asuntoMax';
  }

  // Prioritat (i type) són opcionals en el frontend; el backend pot aplicar defaults.
  // Si s'informa, validem només format bàsic.
  if (formData.priority) {
    if (typeof formData.priority !== 'string' || formData.priority.trim().length === 0) {
      errors.priority = 'validation.ticket.priorityInvalid';
    } else if (formData.priority.length > 20) {
      errors.priority = 'validation.ticket.priorityMax';
    }
  }
  
  return errors;
}
