import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMenuItem } from '../hooks/useMenu';
import { ARViewer } from './ARViewer';
import { useCart } from './CartContext';
import { SkeletonBox, SkeletonText, SkeletonCard, SkeletonCircle } from './Skeleton';

const DishDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { menuItem: product, loading } = useMenuItem(id);

    // State for variants
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);

    useEffect(() => {
        if (product && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
            setCurrentPrice(product.price + product.variants[0].priceModifier);
        }
    }, [product]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 lg:py-12">
                <div className="mb-8">
                    <SkeletonBox width="150px" height="40px" rounded="lg" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[600px]">
                    {/* Left: AR Viewer Skeleton */}
                    <div className="relative h-[50vh] lg:h-auto lg:min-h-[600px]">
                        <SkeletonBox width="100%" height="100%" rounded="xl" className="bg-slate-200" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SkeletonCircle size="60px" />
                        </div>
                    </div>
                    {/* Right: Details Skeleton */}
                    <div className="space-y-6">
                        <SkeletonCard />
                        <div className="space-y-4">
                            <SkeletonText lines={4} />
                            <SkeletonBox width="120px" height="40px" rounded="lg" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return <div className="text-center py-20 text-2xl text-slate-900">Produit non trouvé 😢</div>;

    const handleVariantChange = (variant: any) => {
        setSelectedVariant(variant);
        setCurrentPrice(product.price + variant.priceModifier);
    };

    const handleAddToCart = () => {
        if (!selectedVariant) return;
        addToCart(product, selectedVariant.size, currentPrice);
        // Simple visual feedback
        const btn = document.getElementById('add-btn');
        const mobileBtn = document.getElementById('mobile-add-btn');
        const feedback = "✅ Ajouté !";
        const originalText = `Ajouter au panier • ${currentPrice.toFixed(2)}€`;
        const originalMobileText = `Ajouter • ${currentPrice.toFixed(2)}€`;

        if (btn) {
            btn.innerHTML = feedback;
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
        if (mobileBtn) {
            mobileBtn.innerHTML = feedback;
            setTimeout(() => mobileBtn.innerHTML = originalMobileText, 2000);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 lg:py-12 bg-gradient-to-br from-slate-50 to-blue-50/20 min-h-screen">
            <motion.button
                onClick={() => navigate(-1)}
                className="mb-8 bg-white/90 backdrop-blur-xl border border-white/30 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-primary-600 shadow-soft hover:bg-white hover:scale-110 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <span className="text-xl sm:text-2xl">←</span>
            </motion.button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[600px]">
                {/* Left: AR Viewer */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative h-[50vh] lg:h-auto lg:min-h-[600px]"
                >
                    <ARViewer
                        modelUrl={product.modelUrl}
                        alt={product.name}
                        hotspots={product.hotspots.map((h) => ({
                            slot: h.slot,
                            pos: h.pos,
                            label: h.label,
                            detail: h.detail
                        }))}
                    />
                </motion.div>

                {/* Right: Details */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col space-y-8"
                >
                    <div>
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-slate-900">{product.name}</h1>
                            <div className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-xl shadow-soft">
                                {currentPrice.toFixed(2)}€
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl text-slate-700 font-semibold mt-2">{product.shortDesc}</p>
                        <p className="text-slate-600 text-lg mt-4 leading-relaxed border-l-4 border-primary-200 pl-4">
                            {product.fullDesc}
                        </p>
                    </div>

                    {/* Fiche Technique */}
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/30 p-6 rounded-3xl shadow-soft">
                        <h3 className="font-bold mb-4 text-slate-900 flex items-center gap-2">
                            📊 Info
                        </h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Dimensions</span>
                                <span className="text-slate-900 font-medium">{product.dimensions}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Calories</span>
                                <span className="text-slate-900 font-medium">{product.nutrition.calories} kcal</span>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div>
                        <h3 className="font-bold mb-4 text-slate-900">Choisir la taille</h3>
                        <div className="flex gap-4 bg-slate-100 p-1 rounded-2xl">
                            {product.variants.map((variant: any) => (
                                <button
                                    key={variant.size}
                                    onClick={() => handleVariantChange(variant)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                                        selectedVariant?.size === variant.size
                                            ? 'bg-white text-slate-900 shadow-md scale-105'
                                            : 'text-slate-700 hover:text-slate-900'
                                        }`}
                                >
                                    {variant.size}
                                    {variant.priceModifier > 0 && (
                                        <span className="text-xs block mt-1 text-slate-500">
                                            +{variant.priceModifier.toFixed(0)}€
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-4 hidden lg:block">
                        <motion.button
                            id="add-btn"
                            onClick={handleAddToCart}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-primary-600 text-white font-bold text-lg py-5 rounded-3xl hover:bg-primary-700 transition-all shadow-[0_8px_32px_rgba(37,99,235,0.4)]"
                        >
                            Ajouter au panier • {currentPrice.toFixed(2)}€
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Mobile Sticky Bar - Hidden on LG screens */}
            <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                <motion.button
                    id="mobile-add-btn"
                    onClick={handleAddToCart}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-3xl shadow-2xl transition-transform"
                >
                    Ajouter • {currentPrice.toFixed(2)}€
                </motion.button>
            </div>
        </div>
    );
};

export default DishDetailView;
