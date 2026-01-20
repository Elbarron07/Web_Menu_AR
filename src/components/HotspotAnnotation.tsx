import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface HotspotAnnotationProps {
    hotspot: {
        slot: string;
        pos: string;
        label: string;
        detail?: string;
    };
    isVisible: boolean;
    onClose: () => void;
}

export const HotspotAnnotation = ({ hotspot, isVisible, onClose }: HotspotAnnotationProps) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Calculer la position de l'annotation basée sur la position du hotspot
        // Note: Dans model-viewer, les hotspots sont positionnés dans l'espace 3D
        // On affiche l'annotation en bas de l'écran pour une meilleure UX mobile
        const updatePosition = () => {
            setPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight - 120
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="fixed z-[100] pointer-events-auto"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="glassmorphism-annotation bg-black/85 backdrop-blur-2xl border border-white/30 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-xs sm:max-w-sm mx-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-white font-bold text-base sm:text-lg flex-1">
                                {hotspot.label}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-white/70 hover:text-white transition-colors text-2xl sm:text-3xl leading-none flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
                                aria-label="Fermer"
                            >
                                ×
                            </button>
                        </div>
                        {hotspot.detail && (
                            <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                                {hotspot.detail}
                            </p>
                        )}
                        {/* Indicateur de connexion au hotspot (ligne pointillée visuelle) */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-t from-white/40 to-transparent opacity-50"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
