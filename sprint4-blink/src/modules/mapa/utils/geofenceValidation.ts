export const useGeofenceValidation = () => {
  const validateName = (value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return 'mapa.validation.nameRequired'
    }
    if (value.length > 100) {
      return 'mapa.validation.nameMaxLength'
    }
    return null
  }

  const validateRadius = (value: number | string): string | null => {
    const num = typeof value === 'string' ? Number(value) : value
    if (!num || num <= 0) {
      return 'mapa.validation.radiusRequired'
    }
    if (num > 999999) {
      return 'mapa.validation.radiusMax'
    }
    return null
  }

  const validateLatitude = (value: number | string): string | null => {
    const num = typeof value === 'string' ? Number(value) : value
    if (value === '' || value === null || value === undefined) {
      return 'mapa.validation.latitudeRequired'
    }
    if (isNaN(num) || num < -90 || num > 90) {
      return 'mapa.validation.latitudeInvalid'
    }
    return null
  }

  const validateLongitude = (value: number | string): string | null => {
    const num = typeof value === 'string' ? Number(value) : value
    if (value === '' || value === null || value === undefined) {
      return 'mapa.validation.longitudeRequired'
    }
    if (isNaN(num) || num < -180 || num > 180) {
      return 'mapa.validation.longitudeInvalid'
    }
    return null
  }

  const validateType = (value: string): string | null => {
    const validTypes = ['allowed', 'restricted', 'parking', 'service_area']
    if (!value || !validTypes.includes(value)) {
      return 'mapa.validation.typeRequired'
    }
    return null
  }

  return {
    validateName,
    validateRadius,
    validateLatitude,
    validateLongitude,
    validateType
  }
}
