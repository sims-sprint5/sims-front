import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Escolta en tots els interfaces de xarxa
    port: 5173,
    allowedHosts: ['.lvh.me'],
    hmr: {
      protocol: 'http',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Preserva el hostname original (uberddos.lvh.me) amb el port del backend
            // perquè Django pugui detectar el tenant des del Host header
            if (req.headers.host) {
              const hostname = req.headers.host.split(':')[0];
              proxyReq.setHeader('Host', `${hostname}:8000`);
            }
          });
        },
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
