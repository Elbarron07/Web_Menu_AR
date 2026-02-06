import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import '@google/model-viewer';
import { analytics } from '../lib/analytics';
import { logger } from '../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

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
    menuItemId?: string;
    showPreARControls?: boolean;
}

// Composant de contrôles pré-AR
interface PreARControlsProps {
    onRotateLeft: () => void;
    onRotateRight: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    currentScale: number;
}

const PreARControls: React.FC<PreARControlsProps> = ({
    onRotateLeft,
    onRotateRight,
    onZoomIn,
    onZoomOut,
    onReset,
    currentScale
}) => {
    return (
        <motion.div
            className="pre-ar-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Instructions tactiles */}
            <div className="pre-ar-hint">
                <span className="hint-icon">👆</span>
                <span className="hint-text">Glissez pour tourner • Pincez pour zoomer</span>
            </div>

            {/* Contrôles de manipulation */}
            <div className="pre-ar-buttons">
                {/* Rotation */}
                <div className="control-group">
                    <button
                        onClick={onRotateLeft}
                        className="control-btn"
                        aria-label="Tourner à gauche"
                    >
                        <span className="control-icon">↶</span>
                    </button>
                    <button
                        onClick={onRotateRight}
                        className="control-btn"
                        aria-label="Tourner à droite"
                    >
                        <span className="control-icon">↷</span>
                    </button>
                </div>

                {/* Zoom */}
                <div className="control-group">
                    <button
                        onClick={onZoomOut}
                        className="control-btn"
                        aria-label="Dézoomer"
                    >
                        <span className="control-icon">−</span>
                    </button>
                    <div className="scale-indicator">
                        <span className="scale-value">{Math.round(currentScale * 100)}%</span>
                    </div>
                    <button
                        onClick={onZoomIn}
                        className="control-btn"
                        aria-label="Zoomer"
                    >
                        <span className="control-icon">+</span>
                    </button>
                </div>

                {/* Reset */}
                <button
                    onClick={onReset}
                    className="control-btn reset-btn"
                    aria-label="Réinitialiser la vue"
                >
                    <span className="control-icon">⟲</span>
                </button>
            </div>
        </motion.div>
    );
};

export interface ARViewerRef {
    activateAR: () => Promise<void>;
}

export const ARViewer = forwardRef<ARViewerRef, ARViewerProps>(({ 
    modelUrl, 
    alt, 
    hotspots = [], 
    scale = "1 1 1",
    onHotspotClick,
    menuItemId,
    showPreARControls = true
}, ref) => {
    const modelViewerRef = useRef<any>(null);
    const arSessionStartTime = useRef<number | null>(null);
    
    // État pour les contrôles pré-AR
    const [currentOrbit, setCurrentOrbit] = useState({ theta: 0, phi: 75, radius: 'auto' });
    const [currentFOV, setCurrentFOV] = useState(30);
    const [isARActive, setIsARActive] = useState(false);
    
    // Calcul de l'échelle actuelle basé sur FOV (30deg = 100%)
    const currentScale = 30 / currentFOV;
    
    // Handlers pour les contrôles pré-AR
    const handleRotateLeft = useCallback(() => {
        if (modelViewerRef.current) {
            const newTheta = currentOrbit.theta - 45;
            setCurrentOrbit(prev => ({ ...prev, theta: newTheta }));
            (modelViewerRef.current as any).cameraOrbit = `${newTheta}deg ${currentOrbit.phi}deg ${currentOrbit.radius}`;
        }
    }, [currentOrbit]);
    
    const handleRotateRight = useCallback(() => {
        if (modelViewerRef.current) {
            const newTheta = currentOrbit.theta + 45;
            setCurrentOrbit(prev => ({ ...prev, theta: newTheta }));
            (modelViewerRef.current as any).cameraOrbit = `${newTheta}deg ${currentOrbit.phi}deg ${currentOrbit.radius}`;
        }
    }, [currentOrbit]);
    
    const handleZoomIn = useCallback(() => {
        if (modelViewerRef.current) {
            const newFOV = Math.max(10, currentFOV - 5);
            setCurrentFOV(newFOV);
            (modelViewerRef.current as any).fieldOfView = `${newFOV}deg`;
        }
    }, [currentFOV]);
    
    const handleZoomOut = useCallback(() => {
        if (modelViewerRef.current) {
            const newFOV = Math.min(90, currentFOV + 5);
            setCurrentFOV(newFOV);
            (modelViewerRef.current as any).fieldOfView = `${newFOV}deg`;
        }
    }, [currentFOV]);
    
    const handleReset = useCallback(() => {
        if (modelViewerRef.current) {
            const defaultOrbit = { theta: 0, phi: 75, radius: 'auto' };
            const defaultFOV = 30;
            setCurrentOrbit(defaultOrbit);
            setCurrentFOV(defaultFOV);
            (modelViewerRef.current as any).cameraOrbit = `${defaultOrbit.theta}deg ${defaultOrbit.phi}deg ${defaultOrbit.radius}`;
            (modelViewerRef.current as any).fieldOfView = `${defaultFOV}deg`;
            // Animation fluide vers la position initiale
            (modelViewerRef.current as any).interpolationDecay = 200;
        }
    }, []);

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
        // Mettre à jour l'échelle si elle change
        if (modelViewerRef.current && scale) {
            (modelViewerRef.current as any).scale = scale;
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
                setIsARActive(false);
                // Track AR session end
                if (menuItemId && arSessionStartTime.current) {
                    const duration = Math.round((Date.now() - arSessionStartTime.current) / 1000);
                    analytics.trackARSessionEnd(menuItemId, duration);
                    arSessionStartTime.current = null;
                }
            } else if (status === 'presenting') {
                logger.debug('🥽 Mode AR actif - Modèle ancré sur la surface');
                setIsARActive(true);
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
    }, [modelUrl, menuItemId]);

    const handleHotspotClick = (hotspot: Hotspot) => {
        if (onHotspotClick) {
            onHotspotClick(hotspot);
        }
    };

    return (<>
        <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={alt}
            // Mode AR - Priorité Scene Viewer (plus stable sur Android), puis WebXR, puis Quick Look (iOS)
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            ar-placement="floor"
            xr-environment
            // Contrôles de caméra améliorés pour manipulation tactile
            camera-controls
            touch-action="pan-y"
            interaction-prompt="auto"
            interaction-prompt-style="wiggle"
            interaction-policy="always-allow"
            // Affichage et ombres réalistes
            reveal="auto"
            shadow-intensity="1.2"
            shadow-softness="0.8"
            environment-image="neutral"
            exposure="1"
            // Rotation libre 360 degrés - Vue initiale de face légèrement en hauteur
            camera-orbit="0deg 75deg auto"
            min-camera-orbit="-Infinity 0deg auto"
            max-camera-orbit="Infinity 180deg auto"
            // Zoom flexible pour voir de près ou de loin
            min-field-of-view="10deg"
            max-field-of-view="90deg"
            field-of-view="30deg"
            // Interactions fluides et naturelles
            interpolation-decay="200"
            orbit-sensitivity="1"
            // Configuration pour une meilleure manipulation
            bounds="tight"
            disable-zoom={false}
            disable-pan={false}
            disable-tap={false}
            auto-rotate={false}
            rotation-per-second="0deg"
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'transparent',
                zIndex: 1,
                // Optimisations tactiles
                touchAction: 'pan-y',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
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
        
        {/* Contrôles de manipulation pré-AR */}
        <AnimatePresence>
            {showPreARControls && !isARActive && (
                <PreARControls
                    onRotateLeft={handleRotateLeft}
                    onRotateRight={handleRotateRight}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onReset={handleReset}
                    currentScale={currentScale}
                />
            )}
        </AnimatePresence>
    </>
    );
});

ARViewer.displayName = 'ARViewer';
