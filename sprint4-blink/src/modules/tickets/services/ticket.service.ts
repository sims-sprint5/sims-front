import { apiClient } from '@/shared/services/api.service';
import { authService } from '@/modules/auth/services/auth.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type {
  CreateMessageData,
  CreateTicketData,
  Ticket,
  TicketMessage,
  TicketsResponse,
} from '../types/ticket.types';

function getStoredUserId(): number {
  const user = authService.getUser();
  if (!user?.id) {
    throw { message: 'errors.notAuthenticated', errors: {}, status: 401 };
  }
  return user.id;
}

/**
 * Normalitza un missatge del backend (camps en anglès) als tipus del frontend (camps en espanyol).
 * Suporta: { message, user_id, user: { name } } i { mensaje, usuario_id, usuario_nombre }
 */
function normalizeMessage(msg: any): TicketMessage {
  return {
    id: msg.id,
    ticket_id: msg.ticket_id,
    usuario_id: msg.user_id ?? msg.usuario_id ?? 0,
    mensaje: msg.message ?? msg.mensaje ?? '',
    is_admin: Boolean(msg.is_admin),
    created_at: msg.created_at ?? '',
    usuario_nombre: msg.usuario_nombre ?? msg.user?.name ?? msg.user_name ?? undefined,
  };
}

/**
 * Normalitza un ticket del backend (camps en anglès) als tipus del frontend (camps en espanyol).
 * Suporta: { subject, description, status, user_id, messages } i { asunto, descripcion, estado, usuario_id, mensajes }
 */
function normalizeTicket(raw: any): Ticket {
  const mensajes: TicketMessage[] | undefined = Array.isArray(raw.messages)
    ? raw.messages.map(normalizeMessage)
    : Array.isArray(raw.mensajes)
    ? raw.mensajes.map(normalizeMessage)
    : undefined;

  return {
    id: raw.id ?? raw.ticket_id ?? 0,
    ticket_id: raw.ticket_id ?? raw.id,
    usuario_id: raw.user_id ?? raw.usuario_id ?? 0,
    asunto: raw.subject ?? raw.asunto ?? '',
    descripcion: raw.description ?? raw.descripcion ?? '',
    estado: raw.status ?? raw.estado ?? 'pendiente',
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
    mensajes,
  };
}

/** Normalitza una resposta paginada o array del backend */
function normalizeTicketsResponse(raw: any): TicketsResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeTicket) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeTicket), meta: raw.meta };
  }
  return { data: [] };
}

export const ticketService = {
  /**
   * Obtener tickets del usuario autenticado
   * Endpoint backend: GET /api/v1/tickets/user/{userId}
   */
  async getUserTickets(page: number = 1, perPage: number = 10): Promise<TicketsResponse> {
    const userId = getStoredUserId();
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/tickets/user/${userId}${query}`);
    return normalizeTicketsResponse(raw);
  },

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const userId = getStoredUserId();
    const payload: any = {
      subject: data.asunto,
      description: data.descripcion ?? '',
      user_id: userId,
    };

    payload.type = data.type ?? 'support';
    if (data.priority) payload.priority = data.priority;

    const raw = await apiClient.post<any>('/v1/tickets', payload);
    return normalizeTicket(raw?.data ?? raw);
  },

  async getTicketById(id: number): Promise<Ticket> {
    const [ticketResult, messagesResult] = await Promise.allSettled([
      apiClient.get<any>(`/v1/tickets/${id}`),
      apiClient.get<any>(`/v1/tickets/${id}/messages`),
    ]);

    const rawTicket =
      ticketResult.status === 'fulfilled'
        ? (ticketResult.value?.data ?? ticketResult.value)
        : null;

    if (!rawTicket) {
      throw ticketResult.status === 'rejected'
        ? ticketResult.reason
        : { message: 'errors.requestFailed' };
    }

    const ticket = normalizeTicket(rawTicket);

    if (!ticket.mensajes || ticket.mensajes.length === 0) {
      if (messagesResult.status === 'fulfilled') {
        const msgs = messagesResult.value?.data ?? messagesResult.value;
        if (Array.isArray(msgs)) {
          ticket.mensajes = msgs.map(normalizeMessage);
        }
      }
    }

    return ticket;
  },

  async searchTickets(query: string): Promise<Ticket[]> {
    const response = await this.getUserTickets(1, 200);
    const tickets = Array.isArray(response.data) ? response.data : [];

    const q = query.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter(
      (t) =>
        (t.asunto ?? '').toLowerCase().includes(q) ||
        (t.descripcion ?? '').toLowerCase().includes(q),
    );
  },

  async sendMessage(ticketId: number, data: CreateMessageData): Promise<TicketMessage> {
    const raw = await apiClient.post<any>(`/v1/tickets/${ticketId}/messages`, {
      message: (data as any).mensaje ?? (data as any).message,
      is_admin: false,
    });
    return normalizeMessage(raw?.data ?? raw);
  },
} as const;

export type TicketService = typeof ticketService;
