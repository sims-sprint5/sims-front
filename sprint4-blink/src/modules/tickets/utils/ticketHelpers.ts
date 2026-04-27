/** Returns Tailwind color classes for a given ticket status. */
export function getEstadoClass(estado: string | undefined): string {
  const classes: Record<string, string> = {
    pendiente:  'bg-yellow-100 text-yellow-800',
    pending:    'bg-yellow-100 text-yellow-800',
    open:       'bg-blue-100 text-blue-800',
    obert:      'bg-blue-100 text-blue-800',
    in_progress:'bg-indigo-100 text-indigo-800',
    en_progres: 'bg-indigo-100 text-indigo-800',
    confirmado: 'bg-green-100 text-green-800',
    confirmed:  'bg-green-100 text-green-800',
    resolved:   'bg-emerald-100 text-emerald-800',
    closed:     'bg-surface-muted text-main',
    finalitzat: 'bg-surface-muted text-main',
    cancelado:  'bg-red-100 text-red-800',
    cancelled:  'bg-red-100 text-red-800',
    usado:      'bg-surface-muted text-main',
    used:       'bg-surface-muted text-main',
  };
  return classes[String(estado ?? '')] || 'bg-surface-muted text-main';
}

/** Returns Tailwind color classes for a given ticket priority. */
export function getPriorityClass(priority: string | undefined): string {
  const classes: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    baja: 'bg-slate-100 text-slate-700',
    baixa: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-warning-dark',
    media: 'bg-amber-100 text-warning-dark',
    mitjana: 'bg-amber-100 text-warning-dark',
    high: 'bg-red-100 text-red-800',
    alta: 'bg-red-100 text-red-800',
  };

  return classes[String(priority ?? '').toLowerCase()] || 'bg-surface-muted text-muted';
}
