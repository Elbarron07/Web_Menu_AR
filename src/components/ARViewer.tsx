import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import '@google/model-viewer';
import { analytics } from '../lib/analytics';
import { logger } from '../lib/logger';

interface Hotspot {
    slot: string;
    pos: string;
    label: string;
    detail?: string;
}

interface ARViewerProps {
    modelUrl: string;
    alt: string;
    hotspots?: Hotspot[];
    scale?: string;
    onHotspotClick?: (hotspot: Hotspot) => void;
    onARStatusChange?: (isPresenting: boolean) => void;
    menuItemId?: string;
}

export interface ARViewerRef {
    activateAR: () => Promise<void>;
}

export const ARViewer = forwardRef<ARViewerRef, ARViewerProps>(({ 
    modelUrl, 
    alt, 
    hotspots = [], 
    scale = "1 1 1",
    onHotspotClick,
    onARStatusChange,
    menuItemId
}, ref) => {
    const modelViewerRef = useRef<any>(null);
    const arSessionStartTime = useRef<number | null>(null);

    // Exposer la méthode activateAR via la ref
    useImperativeHandle(ref, () => ({
        activateAR: async () => {
            if (modelViewerRef.current) {
                try {
                    // Activer l'AR programmatiquement
                    await (modelViewerRef.current as any).activateAR();
                } catch (error) {
                    logger.error('Erreur lors de l\'activation AR:', error);
                    throw error;
                }
            }
        }
    }));

    useEffect(() => {
        // Mettre a jour l'echelle via setAttribute pour que model-viewer reagisse
        if (modelViewerRef.current && scale) {
            const mv = modelViewerRef.current as any;
            mv.setAttribute('scale', scale);
            // Recentrer le cadrage apres changement d'echelle
            if (typeof mv.updateFraming === 'function') {
                requestAnimationFrame(() => mv.updateFraming());
            }
        }
    }, [scale]);

    // Gérer le chargement du modèle et activer les interactions
    useEffect(() => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        const handleLoad = () => {
            // Le modèle est chargé, s'assurer que les contrôles caméra sont actifs
            logger.debug('✅ Modèle chargé avec succès:', modelUrl);
            if (modelViewer.cameraControls) {
                logger.debug('✅ Contrôles caméra activés');
            }
            // Donner le focus pour activer les interactions
            modelViewer.focus();
        };

        const handleError = (event: any) => {
            logger.error('❌ Erreur de chargement du modèle:', {
                modelUrl,
                error: event.detail || event,
                message: event.message || 'Erreur inconnue'
            });
        };

        const handleModelVisibility = () => {
            logger.debug('👁️ Modèle visible');
        };

        const handleProgress = (event: any) => {
            const progress = event.detail?.totalProgress || 0;
            if (progress > 0 && progress < 1) {
                logger.debug(`📦 Chargement du modèle: ${Math.round(progress * 100)}%`);
            }
        };

        const handleARStatus = (event: any) => {
            const status = event.detail?.status;
            if (status === 'not-presenting') {
                logger.debug('📱 Mode AR terminé');
                onARStatusChange?.(false);
                // Track AR session end
                if (menuItemId && arSessionStartTime.current) {
                    const duration = Math.round((Date.now() - arSessionStartTime.current) / 1000);
                    analytics.trackARSessionEnd(menuItemId, duration);
                    arSessionStartTime.current = null;
                }
            } else if (status === 'presenting') {
                logger.debug('🥽 Mode AR actif - Modèle ancré sur la surface');
                onARStatusChange?.(true);
                // Track AR session start
                if (menuItemId) {
                    arSessionStartTime.current = Date.now();
                }
            }
        };

        const handleARPlace = () => {
            logger.debug('📍 Modèle placé sur la surface en mode AR');
        };

        // Écouter les événements de chargement
        modelViewer.addEventListener('load', handleLoad);
        modelViewer.addEventListener('error', handleError);
        modelViewer.addEventListener('model-visibility', handleModelVisibility);
        modelViewer.addEventListener('progress', handleProgress);
        
        // Écouter les événements AR pour vérifier l'ancrage
        modelViewer.addEventListener('ar-status', handleARStatus);
        modelViewer.addEventListener('ar-place', handleARPlace);

        // Vérifier si le modèle est déjà chargé
        if ((modelViewer as any).loaded) {
            handleLoad();
        }

        // Log initial pour débogage
        logger.debug('🔍 Initialisation ARViewer avec modèle:', modelUrl);

        return () => {
            modelViewer.removeEventListener('load', handleLoad);
            modelViewer.removeEventListener('error', handleError);
            modelViewer.removeEventListener('model-visibility', handleModelVisibility);
            modelViewer.removeEventListener('progress', handleProgress);
            modelViewer.removeEventListener('ar-status', handleARStatus);
            modelViewer.removeEventListener('ar-place', handleARPlace);
        };
    }, [modelUrl, menuItemId, onARStatusChange]);

    const handleHotspotClick = (hotspot: Hotspot) => {
        if (onHotspotClick) {
            onHotspotClick(hotspot);
        }
    };

    return (
        <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={alt}
            // Mode AR multi-plateforme: WebXR (Chrome), Scene Viewer (Android), Quick Look (iOS)
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
            // Controles de camera ameliores
            camera-controls
            touch-action="none"
            interaction-prompt="auto"
            interaction-prompt-style="basic"
            interaction-policy="always-allow"
            // Affichage
            reveal="auto"
            shadow-intensity="1"
            shadow-softness="0.5"
            // Rotation libre 360 degres - Vue initiale de face
            camera-orbit="0deg 75deg auto"
            min-camera-orbit="-Infinity 0deg auto"
            max-camera-orbit="Infinity 180deg auto"
            // Zoom flexible pour voir de pres ou de loin
            min-field-of-view="10deg"
            max-field-of-view="90deg"
            field-of-view="30deg"
            // Interactions fluides et reactives
            interpolation-decay="50"
            orbit-sensitivity="1.2"
            // Cadrage automatique
            bounds="tight"
            disable-zoom={false}
            disable-pan={false}
            disable-tap={false}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'transparent',
                zIndex: 1
            } as any}
            className="ar-viewer-fullscreen"
            tabIndex={0}
        >
            {/* Hotspots interactifs */}
            {hotspots.map((hotspot, index) => (
                <button
                    key={hotspot.slot || `hotspot-${index}`}
                    slot={`hotspot-${hotspot.slot || index}`}
                    data-position={hotspot.pos}
                    data-normal="0m 1m 0m"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleHotspotClick(hotspot);
                    }}
                    className="hotspot-button"
                    aria-label={hotspot.label}
                >
                    <div className="hotspot-marker">
                        <span className="hotspot-icon">+</span>
                    </div>
                </button>
            ))}
        </model-viewer>
    );
});

ARViewer.displayName = 'ARViewer';
