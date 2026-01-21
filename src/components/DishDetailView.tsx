import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMenuItem } from '../hooks/useMenu';
import { ARViewer } from './ARViewer';
import { useCart } from './CartContext';

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
        return <div className="text-center py-20 text-2xl text-white">Chargement...</div>;
    }

    if (!product) return <div className="text-center py-20 text-2xl text-white">Produit non trouvé 😢</div>;

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
        <div className="container mx-auto px-4 py-6 lg:py-12">
            <button
                onClick={() => navigate(-1)}
                className="mb-8 text-gray-400 hover:text-white flex items-center gap-2 group transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700">
                    ←
                </div>
                <span>Retour au menu</span>
            </button>

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
                            <h1 className="text-5xl font-extrabold mb-2 text-white/90">{product.name}</h1>
                            <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl font-bold text-xl border border-amber-500/20">
                                {currentPrice.toFixed(2)}€
                            </div>
                        </div>
                        <p className="text-xl text-gray-300 font-medium mt-2">{product.shortDesc}</p>
                        <p className="text-gray-400 text-lg mt-4 leading-relaxed border-l-4 border-gray-700 pl-4">
                            {product.fullDesc}
                        </p>
                    </div>

                    {/* Fiche Technique */}
                    <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                        <h3 className="font-bold mb-4 text-gray-200 flex items-center gap-2">
                            📊 Info
                        </h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                <span className="text-gray-500">Dimensions</span>
                                <span className="text-white font-medium">{product.dimensions}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                <span className="text-gray-500">Calories</span>
                                <span className="text-white font-medium">{product.nutrition.calories} kcal</span>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div>
                        <h3 className="font-bold mb-4 text-gray-200">Choisir la taille</h3>
                        <div className="flex gap-4">
                            {product.variants.map((variant: any) => (
                                <button
                                    key={variant.size}
                                    onClick={() => handleVariantChange(variant)}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${selectedVariant?.size === variant.size
                                            ? 'border-amber-500 bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                                            : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    {variant.size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-4 hidden lg:block">
                        <button
                            id="add-btn"
                            onClick={handleAddToCart}
                            className="w-full bg-white text-black font-extrabold text-lg py-5 rounded-2xl hover:bg-gray-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        >
                            Ajouter au panier • {currentPrice.toFixed(2)}€
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Mobile Sticky Bar - Hidden on LG screens */}
            <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                <button
                    id="mobile-add-btn"
                    onClick={handleAddToCart}
                    className="w-full bg-white text-black font-extrabold text-lg py-4 rounded-2xl shadow-2xl active:scale-95 transition-transform border-2 border-white/20"
                >
                    Ajouter • {currentPrice.toFixed(2)}€
                </button>
            </div>
        </div>
    );
};

export default DishDetailView;
