import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://proba.lvh.me:8000'

  return {
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
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.headers.host) {
                const hostname = req.headers.host.split(':')[0]
                proxyReq.setHeader('Host', `${hostname}:8000`)
              }
            })
          },
        },
        '/storage': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/sanctum': {
          target: proxyTarget,
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
  }
})
