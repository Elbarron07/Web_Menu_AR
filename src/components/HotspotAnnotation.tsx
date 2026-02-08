import { motion, AnimatePresence } from 'framer-motion';

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
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -20, y: 10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed z-[100] pointer-events-auto left-4 right-4 sm:left-auto sm:right-auto sm:max-w-sm"
                    style={{ bottom: '180px', left: '16px', right: '16px' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-black/70 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-lg">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-white font-semibold text-sm flex-1">
                                {hotspot.label}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-white/50 hover:text-white transition-colors text-lg leading-none flex-shrink-0 w-5 h-5 flex items-center justify-center"
                                aria-label="Fermer"
                            >
                                &times;
                            </button>
                        </div>
                        {hotspot.detail && (
                            <p className="text-white/60 text-xs leading-relaxed mt-1.5">
                                {hotspot.detail}
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
