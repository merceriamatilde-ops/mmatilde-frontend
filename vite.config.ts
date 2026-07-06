import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    (mode === 'development' ? 'http://localhost:5015' : 'https://api.merceriamatilde.com')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // API .NET — en dev apunta al backend local salvo que definas VITE_API_PROXY_TARGET
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: apiProxyTarget.startsWith('https'),
        },
        // Servicio IA Python (backend-ia en puerto 8000)
        '/ia-api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ia-api/, ''),
        },
      },
    },
  }
})
