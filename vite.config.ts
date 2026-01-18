import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['b18575ae754e.ngrok-free.app'], 
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'convex/react'],
  },
})
