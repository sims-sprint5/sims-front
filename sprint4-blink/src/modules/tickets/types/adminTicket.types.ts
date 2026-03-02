/**
 * Tipos para administración de tickets
 */

export interface TicketMessage {
  id: number;
  ticket_id: number;
  usuario_id: number;
  mensaje: string;
  is_admin: boolean;
  created_at: string;
  usuario_nombre?: string;
}

export interface AdminTicket {
  id: number;
  ticket_id?: number;
  usuario_id: number;
  asunto?: string;
  descripcion?: string;
  estado?: string;
  created_at: string;
  updated_at: string;
  // Información del usuario asociado (join)
  usuario_nombre?: string;
  usuario_email?: string;
  // Mensajes del ticket
  mensajes?: TicketMessage[];
}

export interface UpdateTicketData {
  asunto?: string;
  descripcion?: string;
  estado?: string;
}

export interface CreateMessageData {
  mensaje: string;
}

export interface AdminTicketsResponse {
  data: AdminTicket[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface AdminTicketResponse {
  data: AdminTicket;
}

export const ESTADOS_TICKET = ['pendiente', 'confirmado', 'cancelado', 'usado'] as const;
export type EstadoTicket = typeof ESTADOS_TICKET[number];
