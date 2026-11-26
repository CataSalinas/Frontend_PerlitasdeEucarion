import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '')
  const apiUrl = entorno.VITE_API_URL || 'http://localhost:8080/api/v1'

  return {
    plugins: [react()],
    define: {
      'globalThis.VITE_API_URL': JSON.stringify(apiUrl)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:9090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})