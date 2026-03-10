/** Returns Tailwind color classes for a given ticket status. */
export function getEstadoClass(estado: string | undefined): string {
  const classes: Record<string, string> = {
    pendiente:  'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-green-100 text-green-800',
    cancelado:  'bg-red-100 text-red-800',
    usado:      'bg-gray-100 text-gray-800',
  };
  return classes[String(estado ?? '')] || 'bg-gray-100 text-gray-800';
}
