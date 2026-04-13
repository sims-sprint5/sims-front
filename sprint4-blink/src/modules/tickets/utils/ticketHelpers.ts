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
    closed:     'bg-gray-100 text-gray-800',
    finalitzat: 'bg-gray-100 text-gray-800',
    cancelado:  'bg-red-100 text-red-800',
    cancelled:  'bg-red-100 text-red-800',
    usado:      'bg-gray-100 text-gray-800',
    used:       'bg-gray-100 text-gray-800',
  };
  return classes[String(estado ?? '')] || 'bg-gray-100 text-gray-800';
}

/** Returns Tailwind color classes for a given ticket priority. */
export function getPriorityClass(priority: string | undefined): string {
  const classes: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    baja: 'bg-slate-100 text-slate-700',
    baixa: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-800',
    media: 'bg-amber-100 text-amber-800',
    mitjana: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    alta: 'bg-red-100 text-red-800',
  };

  return classes[String(priority ?? '').toLowerCase()] || 'bg-gray-100 text-gray-700';
}
