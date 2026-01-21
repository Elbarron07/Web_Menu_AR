import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

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
}: HUDOverlayProps) => {
    const [isARLoading, setIsARLoading] = useState(false);
    const [arError, setArError] = useState<string | null>(null);
    const [isARMode, setIsARMode] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

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
            setIsARMode(true);
        } catch (error: any) {
            console.error('Erreur activation AR:', error);
            setArError('AR non disponible');
            setTimeout(() => setArError(null), 3000);
        } finally {
            setIsARLoading(false);
        }
    };

    // Mock popularity si non fourni
    const displayPopularity = popularity || Math.floor(Math.random() * 50) + 10;

    return (
        <AnimatePresence>
            <motion.div
                className={`hud-overlay pointer-events-none fixed inset-0 z-50 flex flex-col ${isARMode ? 'ar-mode' : ''}`}
                initial={false}
                animate={{
                    x: isARMode ? ['0%', '-10%', '0%'] : 0,
                    opacity: isARMode ? [1, 0.7, 1] : 1,
                }}
                transition={{
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1],
                }}
            >
                {/* Top Bar - Product Info Badge avec glassmorphism premium */}
                <div className="pointer-events-auto p-4 sm:p-6 relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
                                    className="text-white text-xs sm:text-sm font-bold ml-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    style={{
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {displayPopularity}
                                </motion.span>
                            </div>
                        )}

                        <div className="flex justify-between items-start gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white drop-shadow-lg truncate uppercase tracking-wide">
                                    {productName}
                                </h1>
                                {productDesc && (
                                    <p className="text-gray-200 text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium line-clamp-2">
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
                                            className="text-amber-400 text-sm sm:text-base"
                                        >
                                            ⏱️
                                        </motion.div>
                                        <span className="text-xs sm:text-sm text-gray-300 font-medium bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/20">
                                            Temps moyen : {preparationTime}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
                                <motion.span
                                    className="text-3xl sm:text-4xl font-black text-amber-400 drop-shadow-lg leading-none"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    style={{
                                        textShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
                                    }}
                                >
                                    {price.toFixed(2)}€
                                </motion.span>
                                {calories && (
                                    <span className="text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/20">
                                        {calories} kcal
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Bouton Immersion Totale avec transition AR */}
                    {onActivateAR && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 sm:mt-4 flex justify-center"
                        >
                            <motion.button
                                onClick={handleActivateAR}
                                disabled={isARLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`glass-panel w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 backdrop-blur-xl shadow-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                                    isARLoading
                                        ? 'bg-blue-500/70 text-white cursor-wait'
                                        : arError
                                        ? 'bg-red-500/70 text-white'
                                        : isARMode
                                        ? 'bg-green-500/90 text-white'
                                        : 'bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white hover:from-blue-600 hover:to-purple-700'
                                }`}
                                style={{
                                    boxShadow: isARMode 
                                        ? '0 0 30px rgba(34, 197, 94, 0.6)' 
                                        : '0 8px 32px rgba(0, 0, 0, 0.3)',
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
                                ) : isARMode ? (
                                    <>
                                        <span className="text-lg sm:text-xl">✨</span>
                                        <span>Mode AR Actif</span>
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

                {/* Middle Section - Side Controls avec transition AR */}
                <motion.div
                    className="flex-1 flex items-center justify-between px-4 sm:px-6 pointer-events-none"
                    animate={{
                        x: isARMode ? [-20, 0] : 0,
                        opacity: isARMode ? [1, 0.8] : 1,
                    }}
                    transition={{
                        duration: 0.6,
                        ease: 'easeInOut',
                    }}
                >
                    {/* Left: Size Selector */}
                    <motion.div
                        className="flex flex-col gap-3 sm:gap-4 pointer-events-auto"
                        animate={{
                            scale: isARMode ? 0.9 : 1,
                            x: isARMode ? -10 : 0,
                        }}
                    >
                        {variants.map((variant) => (
                            <motion.button
                                key={variant.size}
                                onClick={() => onVariantChange(variant)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`size-selector-button w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black backdrop-blur-xl border-2 transition-all shadow-xl ${
                                    selectedVariant?.size === variant.size
                                        ? 'bg-white/90 text-black border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                                        : 'bg-black/20 text-white border-white/30 hover:bg-white/10'
                                }`}
                                style={{
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                }}
                            >
                                <span className="text-xl sm:text-2xl">{variant.size}</span>
                                {variant.priceModifier > 0 && (
                                    <span className="text-[9px] sm:text-[10px] opacity-70">
                                        +{variant.priceModifier.toFixed(0)}€
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Center: Zone libre pour interactions avec le modèle 3D */}
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
                </motion.div>

                {/* Bottom Bar - Add to Cart Button avec transition AR */}
                <motion.div
                    className="pointer-events-auto p-4 sm:p-6 pt-6 sm:pt-8"
                    animate={{
                        y: isARMode ? [0, 20, 0] : 0,
                        opacity: isARMode ? [1, 0.7, 1] : 1,
                    }}
                    transition={{
                        duration: 0.8,
                        ease: 'easeInOut',
                    }}
                >
                    <motion.button
                        onClick={onAddToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full glass-panel bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-xl text-white font-black text-lg sm:text-xl py-4 sm:py-6 rounded-2xl sm:rounded-3xl border border-white/30 shadow-[0_8px_32px_rgba(251,146,60,0.4)] active:shadow-inner flex items-center justify-center gap-2 sm:gap-3 transition-all"
                        style={{
                            boxShadow: '0 8px 32px rgba(251, 146, 60, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <span className="text-xl sm:text-2xl">🛒</span>
                        <span>Commander • {price.toFixed(2)}€</span>
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
