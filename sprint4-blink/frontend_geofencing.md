# Frontend — Geofencing (Mapa) / API Contract

Este documento explica cómo consumir desde el **frontend** el backend (Laravel) para:
- CRUD de **Geofences**
- Mostrar y consultar **logs** de eventos vehículo↔geofence
- Ver/actualizar ubicación de vehículos y ejecutar un **check** de geofencing

> Base del API: el prefijo real es `/api` (Laravel) + versión `/v1`.

---

## 1) Base URL

En local (según README) suele ser:
- `http://localhost:8001/api`

Ejemplos en este doc asumen:
- `BASE_API = http://localhost:8001/api`

---

## 2) Autenticación (Laravel Sanctum, Bearer token)

Las rutas de geofences están protegidas por `auth:sanctum`.

### Login
- `POST {BASE_API}/v1/auth/login`

Body:
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

Response (resumen):
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "user_id": 1,
      "name": "Juan",
      "email": "juan@example.com",
      "role": "admin",
      "phone": null,
      "status": "active"
    },
    "access_token": "1|...",
    "token_type": "Bearer"
  }
}
```

### Headers para llamadas protegidas
Enviar:
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

Ejemplo (fetch):
```js
await fetch(`${BASE_API}/v1/geofences`, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Errores comunes
- `401 Unauthorized`: sin token / token inválido
- `403 Forbidden`: usuario inactivo (en login) u otras reglas futuras
- `422 Unprocessable Entity`: validación (Laravel devuelve `errors` por campo)

---

## 3) Modelo de datos

### 3.1 Geofence (`geofences`)
**PK**: `geofence_id`

Campos (principales):
- `name` (string, requerido, max 100)
- `description` (string, nullable)
- `type` (string, requerido) valores: `allowed | restricted | parking | service_area`
- `center_latitude` (decimal)
- `center_longitude` (decimal)
- `radius` (int, metros)
- `polygon_coordinates` (json/array, nullable)
- `status` (string) valores: `active | inactive` (default: `active`)
- `created_at`, `updated_at`

Notas importantes:
- El endpoint `check-vehicle` **usa sólo** el círculo (`center_*` + `radius`) para determinar si está “adentro”.
- `polygon_coordinates` hoy se guarda/retorna, pero **no se usa** en el cálculo del backend.

### 3.2 Vehicle (`vehicles`) — ubicación
**PK**: `vehicle_id`

Campos de ubicación:
- `current_latitude` (decimal, nullable)
- `current_longitude` (decimal, nullable)
- `last_location_update` (timestamp, nullable)

### 3.3 Logs (`vehicle_geofence_logs`)
**PK**: `log_id`

Campos:
- `vehicle_id` (FK a `vehicles.vehicle_id`)
- `geofence_id` (FK a `geofences.geofence_id`)
- `event_type` (string) comentado como: `entry | exit | violation`
- `event_timestamp` (timestamp)
- `latitude`, `longitude` (decimal)

Nota:
- Actualmente, el backend genera logs en `check-vehicle` con `event_type = entry` o `violation`. No hay lógica de `exit`.

---

## 4) Endpoints — Geofences (CRUD)

Todos requieren `Authorization: Bearer ...`.

### 4.1 Listar geofences
- `GET {BASE_API}/v1/geofences`

Response: array de geofences.

### 4.2 Crear geofence
- `POST {BASE_API}/v1/geofences`

Body (círculo):
```json
{
  "name": "Zona restringida A",
  "description": "No estacionar",
  "type": "restricted",
  "center_latitude": 41.3879,
  "center_longitude": 2.16992,
  "radius": 250,
  "status": "active"
}
```

Body (con polígono guardado):
```json
{
  "name": "Área poligonal",
  "type": "service_area",
  "center_latitude": 41.3879,
  "center_longitude": 2.16992,
  "radius": 250,
  "polygon_coordinates": [
    {"latitude": 41.388, "longitude": 2.169},
    {"latitude": 41.389, "longitude": 2.170},
    {"latitude": 41.387, "longitude": 2.171}
  ],
  "status": "active"
}
```

Notas:
- La API valida `polygon_coordinates` como `array` pero no valida la forma interna. Conviene estandarizar en frontend (por ejemplo `{latitude, longitude}`) y mantenerlo consistente.

### 4.3 Obtener 1 geofence (incluye logs)
- `GET {BASE_API}/v1/geofences/{geofence_id}`

El backend carga `vehicleLogs.vehicle`.

### 4.4 Actualizar geofence
- `PUT/PATCH {BASE_API}/v1/geofences/{geofence_id}`

Body (ejemplo parcial):
```json
{
  "name": "Zona restringida A (edit)",
  "radius": 300,
  "status": "inactive"
}
```

### 4.5 Eliminar geofence
- `DELETE {BASE_API}/v1/geofences/{geofence_id}`

Response:
```json
{ "message": "Geofence eliminada correctamente" }
```

---

## 5) Endpoints extra — logs y check

### 5.1 Logs de una geofence
- `GET {BASE_API}/v1/geofences/{geofence_id}/logs`

Devuelve array de logs ordenados por `event_timestamp desc`, e incluye `vehicle`.

### 5.2 Check: vehículo dentro de geofences activas
- `POST {BASE_API}/v1/geofences/check-vehicle`

Body:
```json
{
  "vehicle_id": 10,
  "latitude": 41.3879,
  "longitude": 2.16992
}
```

Response (resumen):
```json
{
  "vehicle": { "vehicle_id": 10, "license_plate": "1234ABC", "current_latitude": null, "current_longitude": null },
  "inside_geofences": [
    { "geofence_id": 1, "name": "Zona restringida A", "type": "restricted", "radius": 250, "status": "active" }
  ]
}
```

Comportamiento actual:
- Sólo considera geofences con `status = active`.
- Usa distancia (Haversine) desde el centro y compara con `radius`.
- Si está dentro, **crea un log** (uno por geofence encontrada) en cada llamada.
  - `restricted` → `event_type = violation`
  - otros tipos → `event_type = entry`

---

## 6) Endpoints útiles para el mapa — Vehicles (ubicación)

### 6.1 Listar vehículos (para markers)
- `GET {BASE_API}/v1/vehicles`

Incluye `reservations`.

### 6.2 Actualizar ubicación de un vehículo
- `PATCH {BASE_API}/v1/vehicles/{vehicle_id}/location`

Body:
```json
{
  "latitude": 41.3879,
  "longitude": 2.16992
}
```

Response: el vehículo actualizado con `current_latitude`, `current_longitude` y `last_location_update`.

---

## 7) Recomendaciones prácticas para el frontend (sin inventar UX)

- Guardar `geofence_id` como ID primario (no `id`).
- Para dibujar geofences:
  - Círculo: usar `center_latitude`, `center_longitude`, `radius` (metros).
  - Polígono: usar `polygon_coordinates` sólo para render (el backend aún no lo evalúa).
- Evitar spamear `check-vehicle` en intervalos muy cortos si no querés miles de logs (el backend no deduplica).

---

## 8) Tipos sugeridos (TypeScript)

```ts
export type GeofenceType = 'allowed' | 'restricted' | 'parking' | 'service_area'
export type GeofenceStatus = 'active' | 'inactive'

export interface Geofence {
  geofence_id: number
  name: string
  description: string | null
  type: GeofenceType
  center_latitude: string | number
  center_longitude: string | number
  radius: number
  polygon_coordinates: unknown[] | null
  status: GeofenceStatus
  created_at: string
  updated_at: string
}

export interface Vehicle {
  vehicle_id: number
  license_plate: string
  current_latitude: string | number | null
  current_longitude: string | number | null
  last_location_update: string | null
}

export type GeofenceEventType = 'entry' | 'exit' | 'violation'

export interface VehicleGeofenceLog {
  log_id: number
  vehicle_id: number
  geofence_id: number
  event_type: GeofenceEventType
  event_timestamp: string
  latitude: string | number
  longitude: string | number
  vehicle?: Vehicle
}
```

Nota: Laravel serializa `decimal` frecuentemente como **string** en JSON; por eso los tipos permiten `string | number`.

---

## 9) Checklist rápido (integración)

1) `POST /api/v1/auth/login` → guardar `access_token`
2) Configurar cliente HTTP con `Authorization: Bearer ...`
3) `GET /api/v1/geofences` → renderizar shapes
4) `POST /api/v1/geofences` / `PATCH` / `DELETE` → CRUD
5) `PATCH /api/v1/vehicles/{id}/location` + `POST /api/v1/geofences/check-vehicle` → validar geofence
6) `GET /api/v1/geofences/{id}/logs` → historial
