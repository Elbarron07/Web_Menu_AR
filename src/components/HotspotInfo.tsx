import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HotspotInfoProps {
    name: string;
    detail?: string;
    position: string;
    index: number;
}

export const HotspotInfo = ({ name, detail, position, index }: HotspotInfoProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Bouton hotspot */}
            <button
                slot={`hotspot-${index}`}
                data-position={position}
                data-normal="0m 1m 0m"
                onClick={handleClick}
                className="hotspot-button"
                aria-label={`Voir les détails de ${name}`}
            >
                <div className="relative">
                    {/* Icône "+" ou point d'intérêt */}
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] flex items-center justify-center relative z-10 border-2 border-white/50">
                        <span className="text-white font-black text-lg leading-none">+</span>
                        {/* Animation de pulsation */}
                        <div className="absolute inset-0 bg-primary-300 rounded-full opacity-60 animate-ping"></div>
                    </div>
                </div>
            </button>

            {/* Fenêtre flottante (tooltip) - Affichée via un portail React au-dessus du modèle */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-black/90 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-2xl max-w-sm mx-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="text-white font-bold text-lg">{name}</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/70 hover:text-white transition-colors text-2xl leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                    aria-label="Fermer"
                                >
                                    ×
                                </button>
                            </div>
                            {detail && (
                                <p className="text-gray-200 text-sm leading-relaxed">{detail}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
