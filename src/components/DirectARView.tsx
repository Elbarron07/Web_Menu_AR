// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import menuData from '../data/menu.json';
import { useCart } from './CartContext';
import '@google/model-viewer';

const DirectARView = () => {
    const { id } = useParams();
    const dishId = id || "1";
    const product = menuData.find((p: any) => p.id == dishId);

    const { addToCart } = useCart();
    const modelRef = useRef<HTMLElement>(null);

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [scale, setScale] = useState<string>("1 1 1");
    const [activeHotspot, setActiveHotspot] = useState<any>(null);

    useEffect(() => {
        if (product && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
            setCurrentPrice(product.price + product.variants[0].priceModifier);
            setScale(product.variants[0].scale || "1 1 1");
        }
    }, [product]);

    if (!product) return <div className="h-screen w-screen flex items-center justify-center bg-black text-white">Chargement...</div>;

    const handleVariantChange = (variant: any) => {
        setSelectedVariant(variant);
        setCurrentPrice(product.price + variant.priceModifier);
        setScale(variant.scale || "1 1 1");
    };

    const handleAddToCart = () => {
        addToCart(product, selectedVariant.label, currentPrice);
        const msg = document.getElementById('cart-feedback');
        if (msg) {
            msg.classList.remove('opacity-0');
            msg.classList.add('opacity-100');
            setTimeout(() => {
                msg.classList.remove('opacity-100');
                msg.classList.add('opacity-0');
            }, 2000);
        }
    };

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden">

            {/* 1. Fullscreen AR/3D Viewer - The Camera View */}
            <model-viewer
                ref={modelRef}
                src={product.model3D}
                alt={product.name}
                shadow-intensity="1"
                camera-controls
                auto-rotate
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                scale={scale}
                style={{ width: '100vw', height: '100vh', backgroundColor: '#000' } as any}
                className="absolute inset-0"
            >
                {/* Interactive Hotspots */}
                {product.hotspots.map((hotspot: any, idx: number) => (
                    <button
                        key={idx}
                        className="hotspot"
                        slot={`hotspot-${idx}`}
                        data-position={hotspot.position}
                        data-normal="0m 1m 0m"
                        onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                    >
                        <div className="relative">
                            {/* Pulsing Dot */}
                            <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.8)] relative">
                                <div className="absolute inset-0 bg-amber-300 rounded-full opacity-60 animate-ping"></div>
                            </div>

                            {/* Info Bubble - Glassmorphism */}
                            <AnimatePresence>
                                {activeHotspot === idx && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        transition={{ type: "spring", damping: 20 }}
                                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 bg-white/10 backdrop-blur-xl text-white p-4 rounded-2xl border border-white/20 shadow-2xl z-50 pointer-events-none"
                                    >
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 backdrop-blur-xl border-r border-b border-white/20 rotate-45"></div>
                                        <h4 className="font-bold text-amber-300 text-base mb-1.5 flex items-center gap-2">
                                            <span className="text-lg">✨</span>
                                            {hotspot.name}
                                        </h4>
                                        <p className="text-sm text-gray-200 leading-snug">{hotspot.detail}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </button>
                ))}

                {/* AR Activation Button */}
                <div slot="ar-button" className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20">
                    <button className="group flex items-center gap-3 bg-white/90 backdrop-blur-md text-black px-10 py-5 rounded-full font-black text-lg shadow-[0_8px_32px_rgba(255,255,255,0.4)] border border-white/40 hover:bg-white hover:scale-105 transition-all active:scale-95">
                        <span className="text-3xl group-hover:animate-bounce">📱</span>
                        <span>Placer sur ma table</span>
                    </button>
                </div>
            </model-viewer>

            {/* 2. GLASSMORPHISM HUD OVERLAY - Zero Navigation */}
            <div className="absolute inset-0 pointer-events-none z-30 flex flex-col">

                {/* Top Bar - Product Info */}
                <div className="pointer-events-auto p-6 pb-8">
                    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h1 className="text-2xl lg:text-3xl font-black text-white drop-shadow-lg">
                                    {product.name}
                                </h1>
                                <p className="text-gray-200 text-sm mt-1.5 font-medium">{product.shortDesc}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-4xl font-black text-amber-400 drop-shadow-lg leading-none">
                                    {currentPrice.toFixed(2)}€
                                </span>
                                <span className="text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                                    {product.nutrition?.calories} kcal
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Controls - Size Selector (Vertical on sides) */}
                <div className="flex-1 flex items-center justify-between px-6 pointer-events-auto">
                    {/* Left: Size Buttons */}
                    <div className="flex flex-col gap-4">
                        {product.variants.map((variant: any) => (
                            <motion.button
                                key={variant.size}
                                onClick={() => handleVariantChange(variant)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black backdrop-blur-xl border-2 transition-all shadow-xl ${selectedVariant?.size === variant.size
                                        ? 'bg-white/90 text-black border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                                        : 'bg-black/20 text-white border-white/30 hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-2xl">{variant.size}</span>
                                <span className="text-[10px] opacity-70">
                                    {variant.priceModifier > 0 ? `+${variant.priceModifier.toFixed(0)}€` : ''}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: Cart Feedback (Floating) */}
                    <motion.div
                        id="cart-feedback"
                        className="bg-green-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-full border border-white/40 shadow-2xl opacity-0 transition-opacity duration-300"
                    >
                        <span className="font-bold flex items-center gap-2">
                            <span className="text-xl">✓</span>
                            Ajouté !
                        </span>
                    </motion.div>
                </div>

                {/* Bottom Bar - Order Button */}
                <div className="pointer-events-auto p-6 pt-8">
                    <motion.button
                        onClick={handleAddToCart}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-xl text-white font-black text-xl py-6 rounded-3xl border-2 border-white/30 shadow-[0_8px_32px_rgba(251,146,60,0.4)] active:shadow-inner flex items-center justify-center gap-3 transition-all"
                    >
                        <span className="text-2xl">🛒</span>
                        <span>Commander • {currentPrice.toFixed(2)}€</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default DirectARView;
