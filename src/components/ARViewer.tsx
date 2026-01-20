import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import '@google/model-viewer';

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
}

export interface ARViewerRef {
    activateAR: () => Promise<void>;
}

export const ARViewer = forwardRef<ARViewerRef, ARViewerProps>(({ 
    modelUrl, 
    alt, 
    hotspots = [], 
    scale = "1 1 1",
    onHotspotClick 
}, ref) => {
    const modelViewerRef = useRef<any>(null);

    // Exposer la méthode activateAR via la ref
    useImperativeHandle(ref, () => ({
        activateAR: async () => {
            if (modelViewerRef.current) {
                try {
                    // Activer l'AR programmatiquement
                    await (modelViewerRef.current as any).activateAR();
                } catch (error) {
                    console.error('Erreur lors de l\'activation AR:', error);
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
            if (modelViewer.cameraControls) {
                // Activer les contrôles si disponibles
                console.log('Modèle chargé, contrôles caméra activés');
            }
            // Donner le focus pour activer les interactions
            modelViewer.focus();
        };

        const handleError = (event: any) => {
            console.error('Erreur de chargement du modèle:', event);
        };

        // Écouter les événements de chargement
        modelViewer.addEventListener('load', handleLoad);
        modelViewer.addEventListener('error', handleError);

        // Vérifier si le modèle est déjà chargé
        if ((modelViewer as any).loaded) {
            handleLoad();
        }

        return () => {
            modelViewer.removeEventListener('load', handleLoad);
            modelViewer.removeEventListener('error', handleError);
        };
    }, [modelUrl]);

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
            ar
            ar-modes="webxr"
            ar-scale="fixed"
            camera-controls
            interaction-policy="always"
            reveal="interaction"
            shadow-intensity="1"
            auto-rotate-delay="0"
            disable-zoom={false}
            disable-pan={false}
            disable-tap={false}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: '#000000',
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
