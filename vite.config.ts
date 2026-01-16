import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer Three.js et React Three Fiber dans des chunks séparés
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          // Séparer les dépendances lourdes
          'model-viewer': ['@google/model-viewer'],
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Augmenter la limite pour éviter les warnings
  }
})
