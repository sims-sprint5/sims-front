/**
 * Tipos relacionados con tickets
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

export interface Ticket {
  id: number;
  ticket_id?: number; 
  usuario_id: number;
  asunto?: string;
  descripcion?: string;
  fecha_compra?: string;
  estado?: string;
  type?: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  mensajes?: TicketMessage[];
}

export interface CreateTicketData {
  asunto: string;
  descripcion?: string;
  type?: string;
  priority?: string;
}

export interface CreateMessageData {
  mensaje: string;
}

export interface TicketsResponse {
  data: Ticket[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface TicketResponse {
  data: Ticket;
}
