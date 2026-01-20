import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import menuData from '../data/menu.json';
import { useCart } from './CartContext';
import { SimpleMenu } from './SimpleMenu';
import { FoodRadialMenu } from './FoodRadialMenu';
import { ARViewer } from './ARViewer';
import type { ARViewerRef } from './ARViewer';
import { HUDOverlay } from './HUDOverlay';
import { HotspotAnnotation } from './HotspotAnnotation';

const DirectARView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = id ? menuData.find((p: any) => p.id === id) : null;

    const { addToCart } = useCart();
    const arViewerRef = useRef<ARViewerRef>(null);

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [scale, setScale] = useState<string>("1 1 1");
    const [showMenu, setShowMenu] = useState(!id);
    const [showRadialMenu, setShowRadialMenu] = useState(false);
    const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
    const [showCartFeedback, setShowCartFeedback] = useState(false);

    useEffect(() => {
        if (product && product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
            setCurrentPrice(product.price + (product.variants[0].priceModifier || 0));
            setScale(product.variants[0].scale || "1 1 1");
        }
    }, [product]);

    const handleVariantChange = (variant: any) => {
        if (!product) return;
        setSelectedVariant(variant);
        setCurrentPrice(product.price + (variant.priceModifier || 0));
        setScale(variant.scale || "1 1 1");
    };

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;
        addToCart(product, selectedVariant.label, currentPrice);
        setShowCartFeedback(true);
        setTimeout(() => {
            setShowCartFeedback(false);
        }, 2000);
    };

    const handleDishSelect = (dishId: string | number) => {
        setShowMenu(false);
        navigate(`/ar/${dishId}`);
    };

    const handleHotspotClick = (hotspot: any) => {
        setSelectedHotspot(hotspot);
    };

    const handleCloseHotspot = () => {
        setSelectedHotspot(null);
    };

    const handleActivateAR = async () => {
        if (arViewerRef.current) {
            await arViewerRef.current.activateAR();
        }
    };

    // Afficher le menu si aucun plat n'est sélectionné
    useEffect(() => {
        if (!id || !product) {
            setShowMenu(true);
        } else {
            setShowMenu(false);
        }
    }, [id, product]);

    // Convertir les hotspots de l'ancien format au nouveau format si nécessaire
    const convertHotspots = (hotspots: any[]) => {
        return hotspots.map((hotspot, index) => {
            if (hotspot.slot && hotspot.pos && hotspot.label) {
                // Déjà au nouveau format
                return hotspot;
            }
            // Ancien format : convertir
            return {
                slot: hotspot.slot || hotspot.name?.toLowerCase().replace(/\s+/g, '-') || `hotspot-${index}`,
                pos: hotspot.pos || hotspot.position || "0m 0m 0m",
                label: hotspot.label || hotspot.name || "Ingrédient",
                detail: hotspot.detail
            };
        });
    };

    // Convertir menuData en format pour FoodRadialMenu (groupé par catégorie)
    const radialMenuItems = useMemo(() => {
        // Grouper les plats par catégorie
        const categoriesMap = new Map<string, { category: string; icon: string; items: Array<{ name: string; id: string }> }>();
        
        menuData.forEach((dish: any) => {
            const category = dish.category || 'Plats';
            const icon = getCategoryIcon(category);
            
            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, {
                    category,
                    icon,
                    items: []
                });
            }
            
            categoriesMap.get(category)!.items.push({
                name: dish.name,
                id: dish.id
            });
        });

        // Convertir en tableau et formater pour FoodRadialMenu
        return Array.from(categoriesMap.values()).map(cat => ({
            category: cat.category,
            icon: cat.icon,
            items: cat.items.map(item => item.name)
        }));
    }, []);

    // Mapping des IDs pour retrouver le plat sélectionné
    const dishIdMap = useMemo(() => {
        const map = new Map<string, string>();
        menuData.forEach((dish: any) => {
            map.set(dish.name, dish.id);
        });
        return map;
    }, []);

    // Fonction pour obtenir l'icône selon la catégorie
    function getCategoryIcon(category: string): string {
        const iconMap: Record<string, string> = {
            'Plats': '🍽️',
            'Desserts': '🍰',
            'Boissons': '🥤',
            'Entrées': '🥗',
            'Pizza': '🍕',
            'Chawarma': '🥙',
            'Hamburger': '🍔',
            'Frites': '🍟',
            'Poulet': '🍗'
        };
        return iconMap[category] || '🍽️';
    }

    // Gérer la sélection depuis le menu radial
    const handleRadialMenuSelect = (_category: string, item: string) => {
        const dishId = dishIdMap.get(item);
        if (dishId) {
            handleDishSelect(dishId);
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'transparent' }}>
            {/* AR Viewer avec model-viewer fullscreen */}
            {product && product.modelUrl && (
                <ARViewer
                    ref={arViewerRef}
                    modelUrl={product.modelUrl}
                    alt={product.name}
                    hotspots={convertHotspots(product.hotspots || [])}
                    scale={scale}
                    onHotspotClick={handleHotspotClick}
                />
            )}

            {/* Menu Radial Tactique - affiché quand aucun plat n'est sélectionné */}
            {showMenu && !product && (
                <>
                    {/* Bouton pour ouvrir le menu radial */}
                    {!showRadialMenu && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center">
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setShowRadialMenu(true)}
                                className="px-8 py-4 bg-black/80 backdrop-blur-xl text-white font-black text-xl rounded-2xl shadow-2xl border-2 border-white/30 hover:border-amber-400/60 transition-all hover:scale-105"
                            >
                                🎯 Ouvrir le Menu
                            </motion.button>
                        </div>
                    )}

                    {/* Menu Radial */}
                    <FoodRadialMenu
                        menuItems={radialMenuItems}
                        isOpen={showRadialMenu}
                        onClose={() => setShowRadialMenu(false)}
                        onSelectItem={handleRadialMenuSelect}
                        onSelectCategory={(category) => console.log('Catégorie sélectionnée:', category)}
                    />

                    {/* Menu Simple (fallback optionnel) */}
                    {!showRadialMenu && (
                        <div className="absolute inset-0 z-30">
                            <SimpleMenu onSelectDish={handleDishSelect} />
                        </div>
                    )}
                </>
            )}

            {/* HUD Overlay avec glassmorphism */}
            {product && (
                <HUDOverlay
                    productName={product.name}
                    productDesc={product.shortDesc}
                    price={currentPrice}
                    variants={product.variants || []}
                    selectedVariant={selectedVariant}
                    onVariantChange={handleVariantChange}
                    onAddToCart={handleAddToCart}
                    calories={product.nutrition?.calories}
                    showCartFeedback={showCartFeedback}
                    onActivateAR={handleActivateAR}
                />
            )}

            {/* Hotspot Annotation */}
            {selectedHotspot && (
                <HotspotAnnotation
                    hotspot={selectedHotspot}
                    isVisible={!!selectedHotspot}
                    onClose={handleCloseHotspot}
                />
            )}
        </div>
    );
};

export default DirectARView;
