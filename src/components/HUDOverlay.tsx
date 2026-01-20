import { motion } from 'framer-motion';
import { useState } from 'react';

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
    onActivateAR
}: HUDOverlayProps) => {
    const [isARLoading, setIsARLoading] = useState(false);
    const [arError, setArError] = useState<string | null>(null);

    const handleActivateAR = async () => {
        if (!onActivateAR) return;
        
        setIsARLoading(true);
        setArError(null);
        
        try {
            await onActivateAR();
        } catch (error: any) {
            console.error('Erreur activation AR:', error);
            setArError('AR non disponible');
            setTimeout(() => setArError(null), 3000);
        } finally {
            setIsARLoading(false);
        }
    };
    return (
        <div className="hud-overlay pointer-events-none fixed inset-0 z-50 flex flex-col">
            {/* Top Bar - Product Info Badge */}
            <div className="pointer-events-auto p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glassmorphism-badge bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl"
                >
                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white drop-shadow-lg truncate">
                                {productName}
                            </h1>
                            {productDesc && (
                                <p className="text-gray-200 text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium line-clamp-2">
                                    {productDesc}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
                            <span className="text-3xl sm:text-4xl font-black text-amber-400 drop-shadow-lg leading-none">
                                {price.toFixed(2)}€
                            </span>
                            {calories && (
                                <span className="text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/20">
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
                        className="mt-3 sm:mt-4 flex justify-center"
                    >
                        <motion.button
                            onClick={handleActivateAR}
                            disabled={isARLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`glassmorphism-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/30 backdrop-blur-xl shadow-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                                isARLoading
                                    ? 'bg-blue-500/70 text-white cursor-wait'
                                    : arError
                                    ? 'bg-red-500/70 text-white'
                                    : 'bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white hover:from-blue-600 hover:to-purple-700'
                            }`}
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

            {/* Middle Section - Side Controls */}
            <div className="flex-1 flex items-center justify-between px-4 sm:px-6 pointer-events-auto">
                {/* Left: Size Selector */}
                <div className="flex flex-col gap-3 sm:gap-4">
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

                {/* Right: Cart Feedback */}
                {showCartFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="glassmorphism-badge bg-green-500/90 backdrop-blur-xl text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/40 shadow-2xl"
                    >
                        <span className="font-bold flex items-center gap-2 text-sm sm:text-base">
                            <span className="text-lg sm:text-xl">✓</span>
                            Ajouté !
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Bottom Bar - Add to Cart Button */}
            <div className="pointer-events-auto p-4 sm:p-6 pt-6 sm:pt-8">
                <motion.button
                    onClick={onAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full glassmorphism-button bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-xl text-white font-black text-lg sm:text-xl py-4 sm:py-6 rounded-2xl sm:rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(251,146,60,0.4)] active:shadow-inner flex items-center justify-center gap-2 sm:gap-3 transition-all"
                >
                    <span className="text-xl sm:text-2xl">🛒</span>
                    <span>Commander • {price.toFixed(2)}€</span>
                </motion.button>
            </div>
        </div>
    );
};
