import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Enregistrer le service worker PWA avec mise a jour automatique
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    // Verifier les mises a jour toutes les heures
    if (registration) {
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)
    }
    console.log('[PWA] Service worker enregistre:', swUrl)
  },
  onOfflineReady() {
    console.log('[PWA] Application prete pour le mode hors-ligne')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
