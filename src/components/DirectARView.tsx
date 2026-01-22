import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu, useMenuItem } from '../hooks/useMenu';
import { useCart } from './CartContext';
import { SpinningTacticalMenu } from './SpinningTacticalMenu';
import { ARViewer } from './ARViewer';
import type { ARViewerRef } from './ARViewer';
import { HUDOverlay } from './HUDOverlay';
import { HotspotAnnotation } from './HotspotAnnotation';
import { analytics } from '../lib/analytics';

const DirectARView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { menuItems, loading: menuLoading } = useMenu();
    const { menuItem: product, loading: itemLoading } = useMenuItem(id);

    const { addToCart } = useCart();
    const arViewerRef = useRef<ARViewerRef>(null);

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [scale, setScale] = useState<string>("1 1 1");
    const [showMenu, setShowMenu] = useState(!id);
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
        // Track add to cart event
        if (product.id) {
            analytics.trackAddToCart(product.id);
        }
        setShowCartFeedback(true);
            setTimeout(() => {
            setShowCartFeedback(false);
            }, 2000);
    };

    const handleDishSelect = (dishId: string | number) => {
        setShowMenu(false);
        // Utiliser replace: true pour éviter d'ajouter une entrée dans l'historique
        // Cela évite le rechargement complet lors du retour en arrière
        navigate(`/ar/${dishId}`, { replace: true });
    };

    const handleTacticalMenuSelect = (itemId: string) => {
        handleDishSelect(itemId);
    };

    const handleHotspotClick = (hotspot: any) => {
        setSelectedHotspot(hotspot);
        // Track hotspot click event
        if (product?.id && hotspot.slot) {
            analytics.trackHotspotClick(product.id, hotspot.slot);
        }
    };

    const handleCloseHotspot = () => {
        setSelectedHotspot(null);
    };

    const handleActivateAR = async () => {
        if (arViewerRef.current && product?.id) {
            analytics.trackARSessionStart(product.id);
            await arViewerRef.current.activateAR();
        }
    };

    // Track view 3D when product is loaded
    useEffect(() => {
        if (product?.id && id) {
            analytics.trackView3D(product.id);
        }
    }, [product?.id, id]);

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

    // Convertir menuItems en format pour SpinningTacticalMenu
    const tacticalMenuData = useMemo(() => {
        if (!menuItems.length) return { root: [] };
        
        // Grouper les plats par catégorie
        const categoriesMap = new Map<string, Array<{ id: string; label: string; icon?: string; price?: string }>>();
        
        menuItems.forEach((dish) => {
            const category = dish.category || 'Plats';
            
            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, []);
            }
            
            categoriesMap.get(category)!.push({
                id: dish.id,
                label: dish.name,
                price: `${dish.price.toFixed(2)}€`
            });
        });

        // Créer le format attendu par SpinningTacticalMenu
        const rootCategories = Array.from(categoriesMap.keys()).map(category => ({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            label: category,
            icon: getCategoryIcon(category)
        }));

        const menuStructure: {
            root: Array<{ id: string; label: string; icon?: string; price?: string }>;
            [key: string]: Array<{ id: string; label: string; icon?: string; price?: string }>;
        } = {
            root: rootCategories
        };

        // Ajouter les sous-menus pour chaque catégorie
        categoriesMap.forEach((items, category) => {
            const categoryKey = category.toLowerCase().replace(/\s+/g, '-');
            menuStructure[categoryKey] = items;
        });

        return menuStructure;
    }, [menuItems]);

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

    // Afficher un loader pendant le chargement
    if ((id && itemLoading) || (!id && menuLoading)) {
        return (
            <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: 'transparent' }}>
                <div className="text-white text-xl">Chargement du menu...</div>
            </div>
        );
    }

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
                    menuItemId={product.id}
                />
            )}

            {/* Menu Tactique Spinning - affiché quand aucun plat n'est sélectionné */}
            {showMenu && !product && (
                <SpinningTacticalMenu
                    menuData={tacticalMenuData}
                    isOpen={showMenu}
                    onClose={() => setShowMenu(false)}
                    onSelectItem={(itemId, _path) => handleTacticalMenuSelect(itemId)}
                />
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
                    preparationTime={product.nutrition?.temps}
                    popularity={(product as any).popularity || Math.floor(Math.random() * 50) + 10}
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
