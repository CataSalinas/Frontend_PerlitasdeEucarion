import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '')
  const apiUrl = entorno.VITE_API_URL || '/api/v1'

  return {
    plugins: [react()],
    define: {
      // Reemplazo textual para poder usar la misma variable en Vite y en Karma.
      'globalThis.VITE_API_URL': JSON.stringify(apiUrl)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:9090',
          changeOrigin: true
        }
      }
    }
  }
})
