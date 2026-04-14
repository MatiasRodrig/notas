import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4223,
    proxy: {
      '/api': {
        target: 'http://localhost:4222',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4222',
        changeOrigin: true,
      },
    },
  },
})
