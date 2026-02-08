import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';

// ---- Types ----
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// ---- Constantes ----
const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

// ---- Helpers ----
function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ('standalone' in navigator && (navigator as any).standalone === true) return true;
  if (document.referrer.startsWith('android-app://')) return true;
  return false;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function shouldShowBanner(): boolean {
  // Deja en standalone = pas de banniere
  if (isStandalone()) return false;

  // Verifier si le dismiss a expire (> 24h)
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false; // jamais dismiss = le gate devrait etre visible, pas la banniere

  const timestamp = parseInt(dismissed, 10);
  return Date.now() - timestamp >= DISMISS_DURATION_MS;
}

// ---- Composant ----
export const PWAInstallBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const iosDevice = isIOS();

  useEffect(() => {
    if (!shouldShowBanner()) return;

    setVisible(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Si l'app est installee, cacher la banniere
    const handleAppInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Changement de display-mode
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) setVisible(false);
    };
    mql.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mql.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (iosDevice) {
      setShowIOSInstructions(prev => !prev);
      return;
    }

    if (!deferredPromptRef.current) return;
    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
    } catch {
      // ignore
    } finally {
      deferredPromptRef.current = null;
    }
  }, [iosDevice]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9998] max-w-md mx-auto"
        >
          <div
            className="rounded-2xl p-4 shadow-lg"
            style={{
              background: 'rgba(17, 24, 39, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icone */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245, 158, 11, 0.15)' }}
              >
                <Download className="w-5 h-5 text-amber-400" />
              </div>

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Installer Smart Menu AR</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Acces rapide et experience plein ecran
                </p>
              </div>

              {/* Bouton fermer */}
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#111827',
                }}
              >
                <Download className="w-4 h-4" />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-4 rounded-xl text-sm text-gray-400 hover:text-gray-300 transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                Plus tard
              </button>
            </div>

            {/* Instructions iOS (si affichees) */}
            <AnimatePresence>
              {showIOSInstructions && iosDevice && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 space-y-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span>Appuyez sur</span>
                      <Share className="w-3.5 h-3.5 text-blue-400" />
                      <span>Partager</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span>Puis</span>
                      <Plus className="w-3.5 h-3.5 text-gray-300" />
                      <span className="font-medium text-white">Sur l'ecran d'accueil</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
