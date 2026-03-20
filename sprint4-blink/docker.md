# Frontend Docker + Deploy (con Nginx y backend multi-tenant)

Este documento define **qué debe hacer el Docker del frontend** y un ejemplo de **`.github/workflows/deploy-main.yml`** para desplegarlo en producción sin romper el enrutado de Nginx.

---

## 1) Qué debe hacer el Docker del frontend

En producción, el contenedor frontend debe:

1. **Compilar** la app (`npm run build`).
2. **Servir estáticos** (no Vite dev server) con Nginx interno en puerto `80`.
3. Exponer el servicio **solo en red interna Docker** (Nginx del host hará reverse proxy).
4. Tener `restart: unless-stopped`.
5. Incluir healthcheck básico.
6. Usar variables `VITE_*` en build-time (`ARG` + `ENV`) para URL API.

> Importante: en producción no uses `:5173` para API. El error 500 que viste en `:5173` viene del entorno de desarrollo/proxy de Vite.

---

## 2) Dockerfile recomendado (frontend)

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables de build para Vite
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### `nginx/frontend.conf` (dentro del repo frontend)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location = /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

---

## 3) docker-compose.prod.yml (frontend)

```yaml
services:
  frontend:
    image: ghcr.io/TU_ORG/TU_REPO_FRONTEND:latest
    container_name: sims_frontend
    restart: unless-stopped
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://simsgrup2.app
    networks:
      - sims_network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  sims_network:
    external: true
```

---

## 4) Nginx del host (reverse proxy)

Nginx del host (fuera de Docker) debe enrutar:

- `/` hacia `sims_frontend:80`
- `/api` y `/sanctum` hacia `sims_api:8000`

Ejemplo (adaptar `server_name`):

```nginx
server {
    listen 443 ssl http2;
    server_name simsgrup2.app *.simsgrup2.app;

    ssl_certificate /etc/letsencrypt/live/simsgrup2.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/simsgrup2.app/privkey.pem;

    location / {
        proxy_pass http://sims_frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://sims_api:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /sanctum/ {
        proxy_pass http://sims_api:8000/sanctum/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> Si backend y frontend están en repos distintos, ambos deben unirse a la misma red Docker (`sims_network`) o apuntar por IP/puerto accesible.

---

## 5) `deploy-main.yml` recomendado (repo frontend)

Crear en `.github/workflows/deploy-main.yml`:

```yaml
name: Frontend Deploy (main)

on:
  push:
    branches: ["main"]
  workflow_dispatch:

concurrency:
  group: frontend-main-deploy
  cancel-in-progress: true

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup QEMU
        uses: docker/setup-qemu-action@v3

      - name: Setup Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest
            type=sha

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            set -e

            cd /opt/sims-frontend

            echo "VITE_API_URL=${{ secrets.VITE_API_URL }}" > .env

            docker login ghcr.io -u ${{ github.actor }} -p ${{ secrets.GITHUB_TOKEN }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            docker image prune -f
```

---

## 6) Secrets necesarios en GitHub (repo frontend)

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `VITE_API_URL` (ej: `https://simsgrup2.app`)

> `GITHUB_TOKEN` ya existe automáticamente para publicar en GHCR dentro del mismo repo.

---

## 7) Checklist de validación post-deploy

1. `https://simsgrup2.app` carga el frontend.
2. `https://proba16.simsgrup2.app` carga frontend (si usas wildcard al mismo FE).
3. Login hace `POST /api/v1/auth/login` sobre dominio correcto y devuelve `200/401/422`, **nunca 500 vacío**.
4. `GET /sanctum/csrf-cookie` responde `204`.
5. `docker ps` muestra `sims_frontend` en estado `healthy`.

---

## 8) Error que NO debes repetir

Si el frontend llama API vía `:5173` en producción, te expones a errores de proxy de Vite (`500` vacío).  
En producción usa Nginx reverse proxy + frontend build estático.
