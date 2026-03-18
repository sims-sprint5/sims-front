# Mapa de rutas actual (frontend + backend) para enrutar con Nginx

Este documento define **todas las rutas activas** del frontend y los **prefijos API** que backend/Nginx deben enrutar.

## 1) Dominio objetivo

- Frontend público: `https://simsgrup2.app`
- Subdominios tenant (si aplica): `https://<tenant>.simsgrup2.app`

---

## 2) Rutas frontend (Vue Router)

Fuente: [sprint4-blink/src/router/index.ts](sprint4-blink/src/router/index.ts)

### Públicas
- `/` → redirige a `/login`
- `/login`
- `/register`

### Privadas
- `/dashboard`
- `/settings`
- `/admin/users`
- `/admin/vehicles`
- `/reservation`
- `/admin/reservations`
- `/user/tickets`
- `/admin/tickets`
- `/geofencing`
- `/mapa`

### Fallback
- `/:pathMatch(.*)*` → redirige a `/login`

### Nota de guard global
Si backend devuelve `401`, el frontend limpia sesión y redirige a `/login`.

---

## 3) Endpoints API usados por frontend

> Todos van bajo prefijo ` /api ` a nivel dominio, y luego `/v1/...`

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`

### Users
- `GET /api/v1/users?page=&per_page=`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

### Vehicles
- `GET /api/v1/vehicles?page=&per_page=`
- `GET /api/v1/vehicles/:id`
- `POST /api/v1/vehicles`
- `PATCH /api/v1/vehicles/:id`
- `PATCH /api/v1/vehicles/:id/location`
- `DELETE /api/v1/vehicles/:id`

### Geofencing / Mapa
- `GET /api/v1/geofences`
- `GET /api/v1/geofences/:id`
- `POST /api/v1/geofences`
- `PATCH /api/v1/geofences/:id`
- `DELETE /api/v1/geofences/:id`
- `POST /api/v1/geofences/check-vehicle`
- `GET /api/v1/geofences/:id/logs`

### Reservations
- `GET /api/v1/reservations?page=&per_page=`
- `POST /api/v1/reservations`

### Tickets (user)
- `GET /api/v1/tickets/user/:userId?page=&per_page=`
- `POST /api/v1/tickets`
- `GET /api/v1/tickets/:id`
- `GET /api/v1/tickets/:id/messages`
- `POST /api/v1/tickets/:id/messages`

### Tickets (admin)
- `GET /api/v1/tickets?page=&per_page=`
- `GET /api/v1/tickets/:id`
- `PATCH /api/v1/tickets/:id`
- `PATCH /api/v1/tickets/:id/assign`
- `PATCH /api/v1/tickets/:id/status`
- `DELETE /api/v1/tickets/:id`
- `POST /api/v1/tickets/:id/messages`

---

## 4) Reglas Nginx que deben existir

## HTTP -> HTTPS
- Todo `http://...` redirige a `https://...`

## HTTPS principal/wildcard
- `server_name simsgrup2.app www.simsgrup2.app *.simsgrup2.app;`

## Enrutado
- `location /` → SPA frontend (`try_files $uri $uri/ /index.html`)
- `location /api/` → backend (`proxy_pass http://127.0.0.1:8000/api/`)
- `location /storage/` → backend (`proxy_pass http://127.0.0.1:8000/storage/`)

---

## 5) Config de referencia (bloque server)

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name simsgrup2.app www.simsgrup2.app *.simsgrup2.app;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /storage/ {
        proxy_pass http://127.0.0.1:8000/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6) Checklist rápido

- `nginx -t` sin errores
- `curl -I https://simsgrup2.app/login` → `200`
- `curl -I https://simsgrup2.app/api/v1/auth/login` → respuesta backend (200/401/405, pero no 500 Nginx)
- `https://simsgrup2.app/<ruta_vue>` carga sin 404 de servidor (SPA fallback correcto)
