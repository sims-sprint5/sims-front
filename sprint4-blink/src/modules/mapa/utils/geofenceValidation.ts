const GEOFENCE_TYPES = ['allowed', 'restricted', 'parking', 'service_area'] as const

export const validateGeofenceName = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'mapa.validation.nameRequired'
  }
  if (value.length > 100) {
    return 'mapa.validation.nameMaxLength'
  }
  return null
}

export const validateGeofenceRadius = (value: number | string): string | null => {
  const num = typeof value === 'string' ? Number(value) : value
  if (value === '' || value === null || value === undefined || !Number.isFinite(num) || num <= 0) {
    return 'mapa.validation.radiusRequired'
  }
  if (num > 999999) {
    return 'mapa.validation.radiusMax'
  }
  return null
}

export const validateGeofenceLatitude = (value: number | string): string | null => {
  const num = typeof value === 'string' ? Number(value) : value
  if (value === '' || value === null || value === undefined) {
    return 'mapa.validation.latitudeRequired'
  }
  if (!Number.isFinite(num) || num < -90 || num > 90) {
    return 'mapa.validation.latitudeInvalid'
  }
  return null
}

export const validateGeofenceLongitude = (value: number | string): string | null => {
  const num = typeof value === 'string' ? Number(value) : value
  if (value === '' || value === null || value === undefined) {
    return 'mapa.validation.longitudeRequired'
  }
  if (!Number.isFinite(num) || num < -180 || num > 180) {
    return 'mapa.validation.longitudeInvalid'
  }
  return null
}

export const validateGeofenceType = (value: string): string | null => {
  if (!value || !GEOFENCE_TYPES.includes(value as (typeof GEOFENCE_TYPES)[number])) {
    return 'mapa.validation.typeRequired'
  }
  return null
}
