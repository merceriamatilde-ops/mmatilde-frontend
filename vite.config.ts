import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API .NET — en dev usa producción si no tenés el backend local
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://api.merceriamatilde.com',
        changeOrigin: true,
        secure: true,
      },
      // Servicio IA Python (backend-ia en puerto 8000)
      '/ia-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ia-api/, ''),
      },
    },
  },
})
