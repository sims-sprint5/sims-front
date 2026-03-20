/** Returns Tailwind color classes for a given ticket status. */
export function getEstadoClass(estado: string | undefined): string {
  const classes: Record<string, string> = {
    pendiente:  'bg-yellow-100 text-yellow-800',
    pending:    'bg-yellow-100 text-yellow-800',
    open:       'bg-blue-100 text-blue-800',
    in_progress:'bg-indigo-100 text-indigo-800',
    confirmado: 'bg-green-100 text-green-800',
    confirmed:  'bg-green-100 text-green-800',
    resolved:   'bg-emerald-100 text-emerald-800',
    closed:     'bg-gray-100 text-gray-800',
    cancelado:  'bg-red-100 text-red-800',
    cancelled:  'bg-red-100 text-red-800',
    usado:      'bg-gray-100 text-gray-800',
    used:       'bg-gray-100 text-gray-800',
  };
  return classes[String(estado ?? '')] || 'bg-gray-100 text-gray-800';
}
