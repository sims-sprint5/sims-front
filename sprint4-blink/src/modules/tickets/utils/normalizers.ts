export function normalizeTicketMessage(msg: any) {
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
