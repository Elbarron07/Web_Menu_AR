import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
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
    calories,
    showCartFeedback = false,
    onActivateAR,
    preparationTime,
    popularity,
    isARMode: isARModeProp,
}: HUDOverlayProps) => {
    const [isARLoading, setIsARLoading] = useState(false);
    const [arError, setArError] = useState<string | null>(null);
    const [isARModeLocal, setIsARModeLocal] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

    // Utiliser la prop parent si fournie, sinon le state local
    const isARMode = isARModeProp !== undefined ? isARModeProp : isARModeLocal;

    // Générer des cœurs flottants pour la preuve sociale
    useEffect(() => {
        if (!popularity || popularity === 0) return;

        const hearts: Array<{ id: number; x: number; y: number }> = [];
        const heartCount = Math.min(popularity, 5); // Maximum 5 cœurs visibles

        for (let i = 0; i < heartCount; i++) {
            hearts.push({
                id: i,
                x: Math.random() * 100, // Pourcentage de largeur
                y: Math.random() * 20 + 10, // Pourcentage de hauteur (top area)
            });
        }

        setFloatingHearts(hearts);
    }, [popularity]);

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

    // Mock popularity si non fourni
    const displayPopularity = popularity || Math.floor(Math.random() * 50) + 10;

    // Gestion de l'indicateur de gestes / repositionnement
    const [showHint, setShowHint] = useState(true);

    // Masquer l'indicateur apres quelques secondes ou a la premiere interaction
    useEffect(() => {
        const delay = isARMode ? 4000 : 5000;
        setShowHint(true);
        const timer = setTimeout(() => setShowHint(false), delay);
        return () => clearTimeout(timer);
    }, [isARMode]);

    const hideHint = useCallback(() => {
        setShowHint(false);
    }, []);

    // ====================================================================
    // MODE AR : Mini-HUD compact pour liberer la surface tactile
    // ====================================================================
    if (isARMode) {
        return (
            <AnimatePresence>
                <motion.div
                    className="hud-overlay pointer-events-none fixed inset-0 z-30 flex flex-col"
                    initial={false}
                    onTouchStart={hideHint}
                >
                    {/* Mini bandeau haut : nom tronque + prix */}
                    <div className="pointer-events-none p-3 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg"
                        >
                            <span className="text-white font-semibold text-sm truncate max-w-[140px] sm:max-w-[200px]">
                                {productName}
                            </span>
                            <span className="text-white/60">|</span>
                            <span className="text-white font-bold text-sm whitespace-nowrap">
                                {price.toFixed(2)}€
                            </span>
                        </motion.div>
                    </div>

                    {/* Zone centrale : selecteur de taille compact a gauche */}
                    <div className="flex-1 flex items-center px-2 sm:px-3 pointer-events-none">
                        <motion.div
                            className="flex flex-col gap-2 pointer-events-none"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {variants.map((variant) => (
                                <motion.button
                                    key={variant.size}
                                    onClick={() => onVariantChange(variant)}
                                    whileTap={{ scale: 0.9 }}
                                    className={`pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-semibold border transition-all shadow-sm backdrop-blur-md ${
                                        selectedVariant?.size === variant.size
                                            ? 'bg-white/20 text-white border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                                            : 'bg-white/10 text-white/80 border-white/20'
                                    }`}
                                >
                                    <span className="text-base sm:text-lg leading-none">{variant.size}</span>
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Zone libre pour interactions AR (taps de repositionnement) */}
                        <div className="flex-1 pointer-events-none" />

                        {/* Cart Feedback (temporaire) */}
                        {showCartFeedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-green-500/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-2xl pointer-events-auto"
                            >
                                <span className="font-bold flex items-center gap-2 text-sm">
                                    <span>✓</span> Ajouté !
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Indication de repositionnement AR */}
                    <AnimatePresence>
                        {showHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.4 }}
                                className="pointer-events-none flex justify-center pb-3"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2C10.343 2 9 3.343 9 5v7l-1.293-1.293a1 1 0 00-1.414 0l-.586.586a1 1 0 000 1.414l4.586 4.586a2 2 0 002.828 0l3.172-3.172a2 2 0 00.586-1.414V9a2 2 0 00-2-2h-1V5c0-1.657-1.343-3-3-3z"/>
                                    </svg>
                                    <span className="text-xs sm:text-sm font-medium">Touchez une surface pour repositionner</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Petit bouton Commander flottant en bas a droite */}
                    <div className="pointer-events-none p-3 sm:p-4 flex justify-end">
                        <motion.button
                            onClick={onAddToCart}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-sm border border-white/20 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{price.toFixed(2)}€</span>
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // ====================================================================
    // MODE NORMAL : HUD complet avec toutes les informations
    // ====================================================================
    return (
        <AnimatePresence>
            <motion.div
                className="hud-overlay pointer-events-none fixed inset-0 z-50 flex flex-col"
                initial={false}
                onTouchStart={hideHint}
            >
                {/* Top Bar - pointer-events-none sur le conteneur, auto uniquement sur les enfants */}
                <div className="pointer-events-none p-4 sm:p-6 relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pointer-events-auto backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden bg-white/80 border-white/30"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        {/* Social Proof - Floating Hearts */}
                        {floatingHearts.length > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                {floatingHearts.map((heart) => (
                                    <motion.div
                                        key={heart.id}
                                        className="text-red-400 text-lg sm:text-xl"
                                        initial={{ 
                                            opacity: 0, 
                                            scale: 0,
                                            x: heart.x * 10 - 50,
                                            y: heart.y * 5 - 25,
                                        }}
                                        animate={{ 
                                            opacity: [0, 1, 1, 0],
                                            scale: [0, 1.2, 1, 0.8],
                                            y: [heart.y * 5 - 25, heart.y * 5 - 50, heart.y * 5 - 70],
                                            x: [heart.x * 10 - 50, heart.x * 10 - 50 + (Math.random() - 0.5) * 20, heart.x * 10 - 50],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            delay: heart.id * 0.3,
                                            ease: 'easeOut',
                                        }}
                                        style={{
                                            filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))',
                                        }}
                                    >
                                        ❤️
                                    </motion.div>
                                ))}
                                <motion.span
                                    className="text-slate-900 text-xs sm:text-sm font-bold ml-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {displayPopularity}
                                </motion.span>
                            </div>
                        )}

                        <div className="flex justify-between items-start gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate tracking-wide text-slate-900">
                                    {productName}
                                </h1>
                                {productDesc && (
                                    <p className="text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium line-clamp-2 text-slate-600">
                                        {productDesc}
                                    </p>
                                )}
                                
                                {/* Preparation Time Indicator */}
                                {preparationTime && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center gap-2 mt-2 sm:mt-3"
                                    >
                                        <motion.div
                                            animate={{ rotate: [0, 360] }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'linear',
                                            }}
                                            className="text-primary-600 text-sm sm:text-base"
                                        >
                                            ⏱️
                                        </motion.div>
                                        <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full border text-slate-600 bg-slate-100 border-slate-200">
                                            Temps moyen : {preparationTime}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
                                <motion.span
                                    className="text-2xl sm:text-3xl font-black text-primary-600 leading-none"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    {price.toFixed(2)}€
                                </motion.span>
                                {calories && (
                                    <span className="text-xs px-2 sm:px-3 py-1 rounded-full border text-slate-600 bg-slate-100 border-slate-200">
                                        {calories} kcal
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Bouton Immersion Totale */}
                    {onActivateAR && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 sm:mt-4 flex justify-center pointer-events-none"
                        >
                            <motion.button
                                onClick={handleActivateAR}
                                disabled={isARLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`pointer-events-auto w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 rounded-3xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                                    isARLoading
                                        ? 'bg-primary-500 text-white cursor-wait'
                                        : arError
                                        ? 'bg-error-500 text-white'
                                        : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                                }`}
                                style={{
                                    boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
                                }}
                            >
                                {isARLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                        <span>Activation...</span>
                                    </>
                                ) : arError ? (
                                    <>
                                        <span className="text-lg sm:text-xl">⚠️</span>
                                        <span>{arError}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg sm:text-xl">🥽</span>
                                        <span>Immersion Totale</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </div>

                {/* Middle Section - Side Controls : tout pointer-events-none sauf les boutons */}
                <div className="flex-1 flex items-center justify-between px-4 sm:px-6 pointer-events-none">
                    {/* Left: Size Selector - seuls les boutons sont interactifs */}
                    <div className="flex flex-col gap-3 sm:gap-4 pointer-events-none">
                        {variants.map((variant) => (
                            <motion.button
                                key={variant.size}
                                onClick={() => onVariantChange(variant)}
                                whileHover={{ 
                                    scale: 1.1,
                                    transition: { type: 'spring', stiffness: 400, damping: 20 }
                                }}
                                whileTap={{ 
                                    scale: 0.95,
                                    transition: { type: 'spring', stiffness: 600, damping: 30 }
                                }}
                                className={`pointer-events-auto size-selector-button w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-semibold border-2 transition-all shadow-md ${
                                    selectedVariant?.size === variant.size
                                        ? 'bg-white text-slate-900 border-primary-600 scale-110 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                                }`}
                            >
                                <span className="text-xl sm:text-2xl">{variant.size}</span>
                                {variant.priceModifier > 0 && (
                                    <span className="text-[9px] sm:text-[10px] opacity-70">
                                        +{variant.priceModifier.toFixed(0)}€
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Center: Zone libre pour interactions avec le modele 3D */}
                    <div className="flex-1 pointer-events-none" />

                    {/* Right: Cart Feedback */}
                    {showCartFeedback && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="glass-panel bg-green-500/90 backdrop-blur-xl text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/40 shadow-2xl pointer-events-auto"
                        >
                            <span className="font-bold flex items-center gap-2 text-sm sm:text-base">
                                <span className="text-lg sm:text-xl">✓</span>
                                Ajouté !
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Gesture Hints - indicateur de gestes disponibles (mode normal uniquement) */}
                <AnimatePresence>
                    {showHint && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.4 }}
                            className="pointer-events-none flex justify-center pb-2"
                        >
                            <div className="flex items-center gap-4 sm:gap-6 px-5 py-2.5 rounded-full border bg-white/70 backdrop-blur-xl border-white/30 text-slate-600">
                                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                                    <span>1</span>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C10.343 2 9 3.343 9 5v7l-1.293-1.293a1 1 0 00-1.414 0l-.586.586a1 1 0 000 1.414l4.586 4.586a2 2 0 002.828 0l3.172-3.172a2 2 0 00.586-1.414V9a2 2 0 00-2-2h-1V5c0-1.657-1.343-3-3-3z"/></svg>
                                    Rotation
                                </span>
                                <span className="w-px h-4 bg-slate-300" />
                                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                                    <span>2</span>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2C6.343 2 5 3.343 5 5v7l-1.293-1.293a1 1 0 00-1.414 0l-.586.586M16 2c1.657 0 3 1.343 3 5v7l1.293-1.293a1 1 0 011.414 0l.586.586"/></svg>
                                    Déplacer
                                </span>
                                <span className="w-px h-4 bg-slate-300" />
                                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 4l-4 4 4 4M17 4l4 4-4 4M9 20l6-16"/></svg>
                                    Zoom
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Bar - pointer-events-none sur le conteneur, auto sur le bouton */}
                <div className="pointer-events-none p-4 sm:p-6 pt-2 sm:pt-4">
                    <motion.button
                        onClick={onAddToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="pointer-events-auto w-full bg-slate-900 text-white font-bold text-lg sm:text-xl py-4 sm:py-6 rounded-3xl shadow-2xl active:shadow-inner flex items-center justify-center gap-2 sm:gap-3 transition-all hover:bg-slate-800"
                        style={{
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Commander • {price.toFixed(2)}€</span>
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
