# Despliegue del frontend en DigitalOcean (simsgrup2.app)

## 1) Conectarte al droplet

```bash
ssh root@simsgrup2.app
```

## 2) Instalar dependencias del servidor (una sola vez)

```bash
apt update
apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

Tu versión de Node debe ser **20.19+** (o 22.12+).

Si sigue apareciendo `v18.x`, fuerza la actualización así:

```bash
apt remove -y nodejs npm
rm -rf /usr/lib/node_modules /usr/bin/node /usr/bin/npm
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

## 3) Instalar y configurar Nginx en el droplet

```bash
apt update && apt install -y nginx
```

Crear configuración:

```bash
cat > /etc/nginx/sites-available/sims-frontend << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name simsgrup2.app www.simsgrup2.app;

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
EOF
```

Activar sitio:

```bash
ln -sf /etc/nginx/sites-available/sims-frontend /etc/nginx/sites-enabled/sims-frontend
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx
```

## 4) Build y publicación desde el droplet

Clona el repositorio en el servidor y compila allí:

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_DEL_REPO> sims-front
cd /var/www/sims-front/sprint4-blink
npm install
npm run build
```

Publica el resultado:

```bash
rm -rf /usr/share/nginx/html/*
cp -r dist/* /usr/share/nginx/html/
chown -R www-data:www-data /usr/share/nginx/html
chmod -R 755 /usr/share/nginx/html
systemctl reload nginx
```

## 5) Verificar

```bash
curl -I https://simsgrup2.app
```

Para despliegue en servidor usa **build**, no `npm run dev`.

También abre en navegador:

- https://simsgrup2.app

## 6) Requisitos backend (mismo droplet)

- Backend levantado en `127.0.0.1:8000` o `0.0.0.0:8000`.
- Endpoints bajo `/api/...` funcionando.
- Si hay auth por tenant, que acepte requests desde el host del droplet.

## 7) Actualizar frontend en el futuro

Cada vez que cambies frontend, ejecuta esto en el droplet:

```bash
cd /var/www/sims-front
git pull
cd /var/www/sims-front/sprint4-blink
npm install
npm run build
rm -rf /usr/share/nginx/html/*
cp -r dist/* /usr/share/nginx/html/
systemctl reload nginx
```
