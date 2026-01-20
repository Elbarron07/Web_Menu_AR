import { useRef, useEffect } from 'react';
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

export const ARViewer = ({ 
    modelUrl, 
    alt, 
    hotspots = [], 
    scale = "1 1 1",
    onHotspotClick 
}: ARViewerProps) => {
    const modelViewerRef = useRef<any>(null);

    useEffect(() => {
        // Mettre à jour l'échelle si elle change
        if (modelViewerRef.current && scale) {
            (modelViewerRef.current as any).scale = scale;
        }
    }, [scale]);

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
            touch-action="none"
            interaction-policy="allow-when-focused"
            shadow-intensity="1"
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: '#000000',
                touchAction: 'none'
            } as any}
            className="ar-viewer-fullscreen"
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
};
