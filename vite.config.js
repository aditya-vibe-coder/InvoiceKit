import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      clientPort: 443,
    },
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('dexie')) return 'dexie';
            if (id.includes('jspdf')) return 'pdf';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
