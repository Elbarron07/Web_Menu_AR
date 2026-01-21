import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Content Security Policy - Restreint les sources de contenu
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-src 'self' https://*.supabase.co",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      // Strict Transport Security - Force HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      // Empêche le site d'être intégré dans une iframe (protection XSS)
      'X-Frame-Options': 'DENY',
      // Empêche le navigateur de deviner le type MIME
      'X-Content-Type-Options': 'nosniff',
      // Active la protection XSS du navigateur
      'X-XSS-Protection': '1; mode=block',
      // Contrôle de la politique de référent
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions Policy (anciennement Feature-Policy)
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  preview: {
    headers: {
      // Mêmes headers en mode preview (production locale)
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-src 'self' https://*.supabase.co",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
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
