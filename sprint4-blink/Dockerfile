FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS build
COPY . .

ARG VITE_CENTRAL_API_URL
ARG VITE_TENANT_BASE_URL
ARG VITE_TENANT_DOMAIN_SUFFIX
ARG VITE_API_PORT
ARG VITE_APP_BASE_DOMAIN

ENV VITE_CENTRAL_API_URL=${VITE_CENTRAL_API_URL}
ENV VITE_TENANT_BASE_URL=${VITE_TENANT_BASE_URL}
ENV VITE_TENANT_DOMAIN_SUFFIX=${VITE_TENANT_DOMAIN_SUFFIX}
ENV VITE_API_PORT=${VITE_API_PORT}
ENV VITE_APP_BASE_DOMAIN=${VITE_APP_BASE_DOMAIN}

RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
