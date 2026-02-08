import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { logger } from '../lib/logger';

interface Variant {
    size: string;
    label: string;
    priceModifier: number;
}

interface HUDOverlayProps {
    productName: string;
    productDesc?: string;
    price: number;
    variants: Variant[];
    selectedVariant: Variant | null;
    onVariantChange: (variant: Variant) => void;
    onAddToCart: () => void;
    calories?: number;
    showCartFeedback?: boolean;
    onActivateAR?: () => Promise<void>;
    preparationTime?: string;
    popularity?: number;
    isARMode?: boolean;
}

export const HUDOverlay = ({
    productName,
    productDesc,
    price,
    variants,
    selectedVariant,
    onVariantChange,
    onAddToCart,
    showCartFeedback = false,
    onActivateAR,
    preparationTime,
    isARMode: isARModeProp,
}: HUDOverlayProps) => {
    const [isARLoading, setIsARLoading] = useState(false);
    const [arError, setArError] = useState<string | null>(null);
    const [isARModeLocal, setIsARModeLocal] = useState(false);

    const isARMode = isARModeProp !== undefined ? isARModeProp : isARModeLocal;

    const handleActivateAR = async () => {
        if (!onActivateAR) return;
        setIsARLoading(true);
        setArError(null);
        try {
            await onActivateAR();
            setIsARModeLocal(true);
        } catch (error: any) {
            logger.error('Erreur activation AR:', error);
            setArError('AR non disponible');
            setTimeout(() => setArError(null), 3000);
        } finally {
            setIsARLoading(false);
        }
    };

    const displayPrice = (selectedVariant?.priceModifier
        ? price + selectedVariant.priceModifier
        : price
    ).toFixed(2);

    // ====================================================================
    // MODE AR : Mini-HUD compact
    // ====================================================================
    if (isARMode) {
        return (
            <AnimatePresence>
                <motion.div
                    className="hud-overlay pointer-events-none fixed inset-0 z-30 flex flex-col"
                    initial={false}
                >
                    {/* Top bar fine */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pointer-events-auto flex items-center justify-between pl-10 pr-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10"
                    >
                        <span className="text-white font-medium text-sm truncate max-w-[55%]">
                            {productName}
                        </span>
                        <span className="text-white font-medium text-sm">
                            {displayPrice}&euro;
                        </span>
                    </motion.div>

                    {/* Zone centrale : tailles a gauche */}
                    <div className="flex-1 flex items-center px-3 pointer-events-none">
                        <motion.div
                            className="flex flex-col gap-2"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            {variants.map((variant) => (
                                <motion.button
                                    key={variant.size}
                                    onClick={() => onVariantChange(variant)}
                                    whileTap={{ scale: 0.9 }}
                                    className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border transition-all backdrop-blur-sm ${
                                        selectedVariant?.size === variant.size
                                            ? 'bg-white/20 text-white border-white/50'
                                            : 'bg-black/30 text-white/70 border-white/10'
                                    }`}
                                >
                                    {variant.size}
                                </motion.button>
                            ))}
                        </motion.div>

                        <div className="flex-1 pointer-events-none" />

                        {/* Cart Feedback */}
                        <AnimatePresence>
                            {showCartFeedback && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="pointer-events-auto bg-green-500/70 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-white/20"
                                >
                                    <span className="font-medium flex items-center gap-1.5 text-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Ajout&eacute;
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bouton Commander flottant en bas a droite */}
                    <div className="pointer-events-none p-4 flex justify-end">
                        <motion.button
                            onClick={onAddToCart}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md text-white font-medium text-sm border border-white/15"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{displayPrice}&euro;</span>
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // ====================================================================
    // MODE NORMAL : Presentation restaurant professionnelle
    // ====================================================================
    return (
        <AnimatePresence>
            <motion.div
                className="hud-overlay pointer-events-none fixed inset-0 z-50 flex flex-col"
                initial={false}
            >
                {/* Top bar fine et sombre */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto flex items-center justify-between pl-10 pr-4 py-3.5 bg-black/50 backdrop-blur-sm border-b border-white/10"
                >
                    <h1 className="text-white font-medium text-base truncate max-w-[60%]">
                        {productName}
                    </h1>
                    <span className="text-white font-semibold text-base">
                        {displayPrice}&euro;
                    </span>
                </motion.div>

                {/* Zone centrale : VIDE - le plat 3D respire */}
                <div className="flex-1 flex items-center justify-center pointer-events-none">
                    {/* Cart Feedback au centre */}
                    <AnimatePresence>
                        {showCartFeedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="pointer-events-auto bg-green-500/70 backdrop-blur-sm text-white px-5 py-2.5 rounded-full border border-white/20"
                            >
                                <span className="font-medium flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Ajout&eacute; au panier
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Section basse compacte */}
                <div className="pointer-events-none px-4 pb-4 space-y-3">
                    
                    {/* Ligne : tailles (pills) + bouton AR */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2 pointer-events-none"
                    >
                        {/* Pills de taille */}
                        <div className="flex items-center gap-2">
                            {variants.map((variant) => (
                                <motion.button
                                    key={variant.size}
                                    onClick={() => onVariantChange(variant)}
                                    whileTap={{ scale: 0.93 }}
                                    className={`pointer-events-auto h-9 px-4 rounded-full text-sm font-medium border transition-all backdrop-blur-sm ${
                                        selectedVariant?.size === variant.size
                                            ? 'bg-white/20 text-white border-white/50'
                                            : 'bg-black/30 text-white/60 border-white/10'
                                    }`}
                                >
                                    {variant.size}
                                    {variant.priceModifier > 0 && (
                                        <span className="ml-1 text-white/40 text-xs">+{variant.priceModifier.toFixed(0)}&euro;</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <div className="flex-1" />

                        {/* Bouton AR visible */}
                        {onActivateAR && (
                            <motion.button
                                onClick={handleActivateAR}
                                disabled={isARLoading}
                                whileTap={{ scale: 0.93 }}
                                className={`pointer-events-auto h-10 px-5 rounded-full text-xs font-medium border transition-all backdrop-blur-sm flex items-center gap-2 whitespace-nowrap ${
                                    isARLoading
                                        ? 'bg-white/10 text-white/50 border-white/10 cursor-wait'
                                        : arError
                                        ? 'bg-red-500/20 text-red-300 border-red-400/30'
                                        : 'bg-white/15 text-white border-white/25 active:bg-white/25'
                                }`}
                            >
                                {isARLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                                    </svg>
                                )}
                                <span>{arError ? 'Indisponible' : 'Voir en AR'}</span>
                            </motion.button>
                        )}
                    </motion.div>

                    {/* Ligne info : description + temps */}
                    {(productDesc || preparationTime) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 text-white/50 text-xs px-1"
                        >
                            {productDesc && (
                                <span className="truncate">{productDesc}</span>
                            )}
                            {productDesc && preparationTime && (
                                <span className="flex-shrink-0">·</span>
                            )}
                            {preparationTime && (
                                <span className="flex-shrink-0 whitespace-nowrap">{preparationTime}</span>
                            )}
                        </motion.div>
                    )}

                    {/* Bouton Commander */}
                    <motion.button
                        onClick={onAddToCart}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="pointer-events-auto w-full py-3.5 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all bg-white/15 backdrop-blur-md text-white border border-white/15 active:bg-white/25"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Ajouter &middot; {displayPrice}&euro;</span>
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
