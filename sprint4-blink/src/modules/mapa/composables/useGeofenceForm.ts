import { ref, computed, reactive } from 'vue'
import type { Geofence, CreateGeofenceData, UpdateGeofenceData } from '../types/geofence.types'
import {
  validateGeofenceLatitude,
  validateGeofenceLongitude,
  validateGeofenceName,
  validateGeofenceRadius,
  validateGeofenceType
} from '../utils/geofenceValidation'

export interface GeofenceFormData {
  name: string
  description: string
  type: 'allowed' | 'restricted' | 'parking' | 'service_area'
  center_latitude: number | string
  center_longitude: number | string
  radius: number | string
  status: 'active' | 'inactive'
}

export const useGeofenceForm = (initialGeofence?: Geofence) => {
  const validateName = validateGeofenceName
  const validateRadius = validateGeofenceRadius
  const validateLatitude = validateGeofenceLatitude
  const validateLongitude = validateGeofenceLongitude
  const validateType = validateGeofenceType

  const formData = reactive<GeofenceFormData>({
    name: initialGeofence?.name || '',
    description: initialGeofence?.description || '',
    type: initialGeofence?.type || 'restricted',
    center_latitude: initialGeofence?.center_latitude || '',
    center_longitude: initialGeofence?.center_longitude || '',
    radius: initialGeofence?.radius || '',
    status: initialGeofence?.status || 'active'
  })

  const errors = reactive({
    name: null as string | null,
    radius: null as string | null,
    center_latitude: null as string | null,
    center_longitude: null as string | null,
    type: null as string | null
  })

  const isLoading = ref(false)
  const isEditing = computed(() => !!initialGeofence)

  const validateAll = (): boolean => {
    errors.name = validateName(formData.name)
    errors.type = validateType(formData.type)
    errors.radius = validateRadius(formData.radius)
    errors.center_latitude = validateLatitude(formData.center_latitude)
    errors.center_longitude = validateLongitude(formData.center_longitude)

    return Object.values(errors).every(err => err === null)
  }

  const resetForm = () => {
    formData.name = initialGeofence?.name || ''
    formData.description = initialGeofence?.description || ''
    formData.type = initialGeofence?.type || 'restricted'
    formData.center_latitude = initialGeofence?.center_latitude || ''
    formData.center_longitude = initialGeofence?.center_longitude || ''
    formData.radius = initialGeofence?.radius || ''
    formData.status = initialGeofence?.status || 'active'
    Object.assign(errors, {
      name: null,
      radius: null,
      center_latitude: null,
      center_longitude: null,
      type: null
    })
  }

  const getPayload = (): CreateGeofenceData | UpdateGeofenceData => {
    return {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      center_latitude: Number(formData.center_latitude),
      center_longitude: Number(formData.center_longitude),
      radius: Number(formData.radius),
      status: formData.status
    }
  }

  const updateFromGeofence = (geofence: Geofence) => {
    formData.name = geofence.name
    formData.description = geofence.description || ''
    formData.type = geofence.type
    formData.center_latitude = geofence.center_latitude
    formData.center_longitude = geofence.center_longitude
    formData.radius = geofence.radius
    formData.status = geofence.status
  }

  const updateFromMapClick = (lat: number, lon: number, radius: number) => {
    formData.center_latitude = lat
    formData.center_longitude = lon
    formData.radius = radius
  }

  return {
    formData,
    errors,
    isLoading,
    isEditing,
    validateAll,
    resetForm,
    getPayload,
    updateFromGeofence,
    updateFromMapClick,
    validateName,
    validateRadius,
    validateLatitude,
    validateLongitude,
    validateType
  }
}
