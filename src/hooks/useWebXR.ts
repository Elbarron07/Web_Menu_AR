import { useState, useEffect, useRef } from 'react';
import { logger } from '../lib/logger';

interface UseWebXRReturn {
  session: XRSession | null;
  referenceSpace: XRReferenceSpace | null;
  isSupported: boolean;
  isSessionActive: boolean;
  error: string | null;
  startSession: (gl: WebGLRenderingContext | WebGL2RenderingContext) => Promise<void>;
  endSession: () => void;
  requestHitTest: (x: number, y: number) => Promise<XRHitTestResult[] | null>;
}

export const useWebXR = (): UseWebXRReturn => {
  const [session, setSession] = useState<XRSession | null>(null);
  const [referenceSpace, setReferenceSpace] = useState<XRReferenceSpace | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);

  // Vérifier le support WebXR
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsSupported(supported);
        if (!supported) {
          setError('WebXR AR n\'est pas supporté sur cet appareil');
        }
      }).catch(() => {
        setIsSupported(false);
        setError('Erreur lors de la vérification du support WebXR');
      });
    } else {
      setIsSupported(false);
      setError('WebXR n\'est pas disponible dans ce navigateur');
    }
  }, []);

  const startSession = async (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
    if (!navigator.xr) {
      setError('WebXR n\'est pas disponible dans ce navigateur');
      return;
    }

    if (!isSupported) {
      setError('WebXR AR n\'est pas supporté sur cet appareil');
      return;
    }

    try {
      setError(null);
      glRef.current = gl;

      // Créer la session AR immersive
      const xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor', 'hit-test'],
        optionalFeatures: ['bounded-floor', 'dom-overlay']
      });

      setSession(xrSession);
      setIsSessionActive(true);

      // Créer l'espace de référence
      const refSpace = await xrSession.requestReferenceSpace('local-floor');
      setReferenceSpace(refSpace);

      // Créer la source de hit test pour la détection de plans
      const viewerSpace = await xrSession.requestReferenceSpace('viewer');
      if (xrSession.requestHitTestSource) {
        const hitTestSource = await xrSession.requestHitTestSource({
          space: viewerSpace
        } as any);
        
        if (hitTestSource) {
          hitTestSourceRef.current = hitTestSource;
        }
      }

      // Gérer la fin de session
      xrSession.addEventListener('end', () => {
        setIsSessionActive(false);
        setSession(null);
        setReferenceSpace(null);
        hitTestSourceRef.current = null;
      });

      // Lier le contexte WebGL à la session XR
      const webglContext = gl as any;
      if (webglContext.makeXRCompatible) {
        webglContext.makeXRCompatible().then(() => {
          xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(xrSession, gl)
          });
        }).catch((err: any) => {
          logger.error('Erreur makeXRCompatible:', err);
        });
      } else {
        // Fallback pour navigateurs sans makeXRCompatible
        try {
          xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(xrSession, gl)
          });
        } catch (err: any) {
          logger.error('Erreur updateRenderState:', err);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du démarrage de la session WebXR';
      setError(errorMessage);
      logger.error('Erreur WebXR:', err);
    }
  };

  const endSession = () => {
    if (session) {
      session.end().catch((err) => {
        logger.error('Erreur lors de la fermeture de la session:', err);
      });
    }
  };

  const requestHitTest = async (_x: number, _y: number): Promise<XRHitTestResult[] | null> => {
    if (!session || !hitTestSourceRef.current || !referenceSpace) {
      return null;
    }

    try {
      const frame = await new Promise<XRFrame>((resolve) => {
        const onFrame = (_time: number, frame: XRFrame) => {
          session.requestAnimationFrame(onFrame);
          resolve(frame);
        };
        session.requestAnimationFrame(onFrame);
      });

      const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
      return Array.from(hitTestResults);
    } catch (err) {
      logger.error('Erreur hit test:', err);
      return null;
    }
  };

  // Nettoyer la session au démontage
  useEffect(() => {
    return () => {
      if (session) {
        endSession();
      }
    };
  }, [session]);

  return {
    session,
    referenceSpace,
    isSupported,
    isSessionActive,
    error,
    startSession,
    endSession,
    requestHitTest
  };
};
