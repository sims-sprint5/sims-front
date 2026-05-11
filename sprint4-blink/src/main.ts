import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue error]', info, err)
  router.push({ name: 'ServerError' }).catch(() => {})
}

window.addEventListener('unhandledrejection', (event) => {
  const status = (event.reason as any)?.status
  if (status && status >= 500) {
    router.push({ name: 'ServerError', query: { code: String(status) } }).catch(() => {})
  }
})

app
  .use(router)
  .use(i18n)
  .mount('#app')
