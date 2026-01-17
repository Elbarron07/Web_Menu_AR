import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import menuData from '../data/menu.json';
import { useCart } from './CartContext';

// Lazy load du composant WebXR lourd
const WebXRViewer = lazy(() => import('./WebXRViewer').then(module => ({ default: module.WebXRViewer })));

const DirectARView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dishId = id ? parseInt(id) : null;
    const product = dishId ? menuData.find((p: any) => p.id === dishId) : null;

    const { addToCart } = useCart();

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [scale, setScale] = useState<string>("1 1 1");
    const [selectedDishId, setSelectedDishId] = useState<number | null>(dishId || null);

    useEffect(() => {
        if (product && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
            setCurrentPrice(product.price + product.variants[0].priceModifier);
            setScale(product.variants[0].scale || "1 1 1");
        }
    }, [product]);

    useEffect(() => {
        if (dishId) {
            setSelectedDishId(dishId);
        }
    }, [dishId]);

    const handleVariantChange = (variant: any) => {
        if (!product) return;
        setSelectedVariant(variant);
        setCurrentPrice(product.price + variant.priceModifier);
        setScale(variant.scale || "1 1 1");
    };

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;
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

    const handleDishSelect = (dishId: number) => {
        setSelectedDishId(dishId);
        navigate(`/ar/${dishId}`);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'transparent' }}>
            {/* WebXR Viewer avec caméra en fond et menu/3D */}
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="text-white text-lg">Chargement de l'expérience AR...</div>
                </div>
            }>
                <WebXRViewer
                    modelPath={product?.model3D}
                    selectedDishId={selectedDishId || undefined}
                    onDishSelect={handleDishSelect}
                    hotspots={product?.hotspots || []}
                    scale={scale}
                    dimensions={product?.dimensions}
                />
            </Suspense>

            {/* GLASSMORPHISM HUD OVERLAY - Zero Navigation */}
            {product && (
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
            )}
        </div>
    );
};

export default DirectARView;
