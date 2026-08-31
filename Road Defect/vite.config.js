import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/src/dataset/**',
        '**/backend/**',
        '**/.venv/**',
        '**/.python/**',
        '**/models/**',
        '**/uploads/**',
        '**/*.yaml',
        '**/*.pt',
        '**/*.pth'
      ]
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          pdf: ['jspdf', 'html2canvas'],
          icons: ['lucide-react']
        }
      }
    }
  },
})
