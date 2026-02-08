import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, Plus, ChevronUp, Sparkles, Eye, Zap } from 'lucide-react';

// ---- Types ----
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallGateProps {
  children: React.ReactNode;
}

// ---- Constantes ----
const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const BYPASS_DELAY_MS = 5000; // 5 secondes avant d'afficher le bouton bypass

// ---- Helpers ----
function isStandalone(): boolean {
  // Chromium: display-mode: standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if ('standalone' in navigator && (navigator as any).standalone === true) return true;
  // TWA Android
  if (document.referrer.startsWith('android-app://')) return true;
  return false;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const timestamp = parseInt(dismissed, 10);
  return Date.now() - timestamp < DISMISS_DURATION_MS;
}

function setDismissed(): void {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

// ---- Composant ----
export const PWAInstallGate = ({ children }: PWAInstallGateProps) => {
  const [shouldShowGate, setShouldShowGate] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const iosDevice = useRef(false);

  // Verifier si on doit afficher le gate
  useEffect(() => {
    // Deja en mode standalone = pas de gate
    if (isStandalone()) {
      setShouldShowGate(false);
      return;
    }

    // Dismiss recent = pas de gate
    if (isDismissedRecently()) {
      setShouldShowGate(false);
      return;
    }

    // iOS detection
    iosDevice.current = isIOS();

    // Afficher le gate
    setShouldShowGate(true);

    // Ecouter l'evenement beforeinstallprompt (Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Ecouter si l'app est installee
    const handleAppInstalled = () => {
      setInstalled(true);
      setTimeout(() => setShouldShowGate(false), 1500);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Ecouter le changement de display-mode
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setShouldShowGate(false);
      }
    };
    mql.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mql.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  // Timer pour afficher le bouton bypass
  useEffect(() => {
    if (!shouldShowGate) return;
    const timer = setTimeout(() => setShowBypass(true), BYPASS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldShowGate]);

  // Installer via prompt natif (Chromium)
  const handleInstall = useCallback(async () => {
    if (!deferredPromptRef.current) return;
    setInstalling(true);
    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setTimeout(() => setShouldShowGate(false), 1500);
      }
    } catch {
      // Prompt deja affiche ou erreur
    } finally {
      setInstalling(false);
      deferredPromptRef.current = null;
    }
  }, []);

  // Bypass : continuer sans installer
  const handleBypass = useCallback(() => {
    setDismissed();
    setShouldShowGate(false);
  }, []);

  // Si pas besoin de gate, afficher directement les enfants
  if (!shouldShowGate) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      {shouldShowGate && (
        <motion.div
          key="pwa-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #111827 100%)' }}
        >
          {/* Particules decoratives */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + Math.random() * 8,
                  height: 4 + Math.random() * 8,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  background: `rgba(245, 158, 11, ${0.15 + Math.random() * 0.25})`
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Contenu principal */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 flex flex-col items-center px-6 max-w-md mx-auto text-center"
          >
            {/* Logo / Icone app */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Smartphone className="w-10 h-10 text-amber-400" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="w-6 h-6 text-amber-300" />
              </motion.div>
            </motion.div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-white mb-3">
              Smart Menu AR
            </h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Installez l'application pour une experience immersive complete en realite augmentee.
            </p>

            {/* Avantages */}
            <div className="w-full space-y-3 mb-8">
              {[
                { icon: Zap, text: 'Acces rapide depuis votre ecran d\'accueil' },
                { icon: Eye, text: 'Experience plein ecran immersive' },
                { icon: Smartphone, text: 'Camera AR optimisee pour vos plats' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                  >
                    <item.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-gray-300">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Etat "Installe" */}
            {installed && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-green-400 mb-6"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Application installee !</span>
              </motion.div>
            )}

            {/* Boutons d'installation */}
            {!installed && (
              <>
                {/* Chromium : bouton installer */}
                {!iosDevice.current && (
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleInstall}
                    disabled={installing || !deferredPromptRef.current}
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#111827',
                      boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <Download className="w-5 h-5" />
                    {installing ? 'Installation...' : 'Installer l\'application'}
                  </motion.button>
                )}

                {/* Si le prompt n'est pas dispo et pas iOS, message d'attente */}
                {!iosDevice.current && !deferredPromptRef.current && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-xs text-gray-500 mt-3"
                  >
                    L'installation sera disponible dans un instant...
                  </motion.p>
                )}

                {/* iOS : instructions manuelles */}
                {iosDevice.current && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full p-5 rounded-2xl text-left space-y-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <p className="text-sm font-medium text-white mb-4">
                      Pour installer sur iOS :
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-400">1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">Appuyez sur</span>
                          <Share className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Partager</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-400">2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">Faites defiler vers le bas</span>
                          <ChevronUp className="w-4 h-4 text-gray-400 rotate-180" />
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-400">3</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">Appuyez sur</span>
                          <Plus className="w-4 h-4 text-gray-300" />
                          <span className="text-sm font-medium text-white">Sur l'ecran d'accueil</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Bouton bypass (apparait apres 5s) */}
            <AnimatePresence>
              {showBypass && !installed && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleBypass}
                  className="mt-6 text-sm text-gray-500 hover:text-gray-400 transition-colors underline underline-offset-4"
                >
                  Continuer sans installer
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
