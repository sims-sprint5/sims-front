import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type {
  AdminTicket,
  AdminTicketsResponse,
  CreateMessageData,
  TicketMessage,
  UpdateTicketData,
} from '../types/adminTicket.types';

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
 * Normalitza un ticket (admin) del backend (camps en anglès) als tipus del frontend (camps en espanyol).
 * Suporta: { subject, description, status, user_id, messages, user: { name, email } }
 * i { asunto, descripcion, estado, usuario_id, mensajes, usuario_nombre, usuario_email }
 */
function normalizeAdminTicket(raw: any): AdminTicket {
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
    usuario_nombre: raw.user?.name ?? raw.usuario_nombre ?? undefined,
    usuario_email: raw.user?.email ?? raw.usuario_email ?? undefined,
    mensajes,
  };
}

/** Normalitza una resposta paginada o array del backend */
function normalizeAdminTicketsResponse(raw: any): AdminTicketsResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeAdminTicket) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeAdminTicket), meta: raw.meta };
  }
  return { data: [] };
}

export const adminTicketService = {
  /**
   * Listado de tickets (admin)
   * Endpoint backend: GET /api/v1/tickets
   */
  async getTickets(page: number = 1, perPage: number = 10): Promise<AdminTicketsResponse> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/tickets${query}`);
    return normalizeAdminTicketsResponse(raw);
  },

  /**
   * Obtenir ticket per ID incloent missatges.
   * Endpoints: GET /api/v1/tickets/{id} + GET /api/v1/tickets/{id}/messages
   */
  async getTicketById(id: number): Promise<AdminTicket> {
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

    const ticket = normalizeAdminTicket(rawTicket);

    // Combinar missatges de la petició separada si el ticket no els inclou
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

  /**
   * Actualitzar ticket.
   * Endpoint backend: PATCH /api/v1/tickets/{id}
   */
  async updateTicket(id: number, data: UpdateTicketData): Promise<AdminTicket> {
    const payload: any = {};
    if (data.asunto !== undefined) payload.subject = data.asunto;
    if (data.descripcion !== undefined) payload.description = data.descripcion;
    if (data.estado !== undefined) payload.status = data.estado;
    const raw = await apiClient.patch<any>(`/v1/tickets/${id}`, payload);
    return normalizeAdminTicket(raw?.data ?? raw);
  },

  /**
   * Assignar agent a ticket.
   * Endpoint backend: PATCH /api/v1/tickets/{id}/assign
   */
  async assignTicket(id: number, agentId: number): Promise<AdminTicket> {
    const raw = await apiClient.patch<any>(`/v1/tickets/${id}/assign`, { agent_id: agentId });
    return normalizeAdminTicket(raw?.data ?? raw);
  },

  /**
   * Actualitzar estat del ticket.
   * Endpoint backend: PATCH /api/v1/tickets/{id}/status
   */
  async updateStatus(id: number, status: string): Promise<AdminTicket> {
    const raw = await apiClient.patch<any>(`/v1/tickets/${id}/status`, { status });
    return normalizeAdminTicket(raw?.data ?? raw);
  },

  /**
   * Eliminar ticket.
   * Endpoint backend: DELETE /api/v1/tickets/{id}
   */
  async deleteTicket(id: number): Promise<void> {
    await apiClient.delete<void>(`/v1/tickets/${id}`);
  },

  async searchTickets(query: string): Promise<AdminTicket[]> {
    const response = await this.getTickets(1, 200);
    const tickets = Array.isArray(response.data) ? response.data : [];

    const q = query.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((t) =>
      (t.asunto ?? '').toLowerCase().includes(q) ||
      (t.descripcion ?? '').toLowerCase().includes(q) ||
      (t.usuario_nombre ?? '').toLowerCase().includes(q) ||
      (t.usuario_email ?? '').toLowerCase().includes(q),
    );
  },

  /**
   * Enviar missatge al ticket.
   * Endpoint backend: POST /api/v1/tickets/{id}/messages
   */
  async sendMessage(ticketId: number, data: CreateMessageData): Promise<TicketMessage> {
    const raw = await apiClient.post<any>(`/v1/tickets/${ticketId}/messages`, {
      message: (data as any).mensaje ?? (data as any).message,
      is_admin: true,
    });
    return normalizeMessage(raw?.data ?? raw);
  },
} as const;

export type AdminTicketService = typeof adminTicketService;
