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
import { normalizeTicketMessage } from '@/modules/tickets/utils/normalizers';

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
  return normalizeTicketMessage(msg) as TicketMessage;
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
    type: raw.type ?? raw.tipo ?? undefined,
    priority: raw.priority ?? raw.prioridad ?? undefined,
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

    if (data.type) payload.type = data.type;
    if (data.priority) payload.priority = data.priority;

    const postTicket = async (body: any) => {
      const raw = await apiClient.post<any>('/v1/tickets', body);
      return normalizeTicket(raw?.data ?? raw);
    };

    const hasFieldError = (err: any, field: string): boolean => {
      const errors = err?.errors;
      if (!errors || typeof errors !== 'object') return false;
      return Object.prototype.hasOwnProperty.call(errors, field) && errors[field] != null;
    };

    try {
      return await postTicket(payload);
    } catch (error: any) {
      if (error?.status === 422 && (payload.type || payload.priority)) {
        const typeValue = String(payload.type ?? '');
        const isSupport = typeValue.toLowerCase() === 'support';

        // Caso especial: solo falla "support" en backend. Probamos alternativas comunes.
        if (isSupport) {
          const candidates = ['soporte', 'suport'];
          for (const candidate of candidates) {
            try {
              return await postTicket({ ...payload, type: candidate });
            } catch (e: any) {
              if (e?.status !== 422) throw e;
            }

            try {
              const { type, ...rest } = payload;
              return await postTicket({ ...rest, tipo: candidate });
            } catch (e: any) {
              if (e?.status !== 422) throw e;
            }
          }
        }

        // Si el backend marca explícitamente type/priority como inválidos, los eliminamos y reintentamos.
        const nextPayload: any = { ...payload };
        let changed = false;

        if (payload.type && (hasFieldError(error, 'type') || hasFieldError(error, 'tipo'))) {
          delete nextPayload.type;
          delete nextPayload.tipo;
          changed = true;
        }
        if (payload.priority && (hasFieldError(error, 'priority') || hasFieldError(error, 'prioridad'))) {
          delete nextPayload.priority;
          delete nextPayload.prioridad;
          changed = true;
        }

        if (changed) {
          return await postTicket(nextPayload);
        }
      }

      throw error;
    }
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
