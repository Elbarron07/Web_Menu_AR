import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu, useMenuItem } from '../hooks/useMenu';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';
import { useCart } from './CartContext';
import { SpinningTacticalMenu } from './SpinningTacticalMenu';
import { ARViewer } from './ARViewer';
import type { ARViewerRef } from './ARViewer';
import { HUDOverlay } from './HUDOverlay';
import { HotspotAnnotation } from './HotspotAnnotation';
import { analytics } from '../lib/analytics';
import { ARViewerSkeleton } from './skeletons/ARViewerSkeleton';
import { MenuSkeleton } from './skeletons/MenuSkeleton';
import { motion } from 'framer-motion';

const DirectARView = () => {
    const { id, categorySlug } = useParams();
    const navigate = useNavigate();
    const { menuItems, loading: menuLoading } = useMenu();
    const { menuItem: product, loading: itemLoading } = useMenuItem(id);
    const { settings } = useRestaurantSettings();

    const { addToCart } = useCart();
    const arViewerRef = useRef<ARViewerRef>(null);

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [scale, setScale] = useState<string>("1 1 1");
    const [showMenu, setShowMenu] = useState(!id);
    const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
    const [showCartFeedback, setShowCartFeedback] = useState(false);
    // isARRoute = on est sur une route AR (style CSS : fond noir, pas de scroll)
    const [isARRoute, setIsARRoute] = useState(false);
    // isARSessionActive = session WebXR/Scene Viewer reellement active (model-viewer presenting)
    const [isARSessionActive, setIsARSessionActive] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

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
        // Push dans l'historique pour que le bouton retour ramene au sous-menu
        navigate(`/ar/${dishId}`);
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

    // Callback quand model-viewer change de status AR (presenting / not-presenting)
    const handleARStatusChange = useCallback((isPresenting: boolean) => {
        setIsARSessionActive(isPresenting);
    }, []);

    // Detecter la route AR via la classe html.ar-mode (pour le style CSS)
    useEffect(() => {
        const checkARRoute = () => {
            setIsARRoute(document.documentElement.classList.contains('ar-mode'));
        };
        checkARRoute();
        const observer = new MutationObserver(checkARRoute);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        return () => observer.disconnect();
    }, []);

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

    // Carrousel automatique pour les images d'arrière-plan
    useEffect(() => {
        if (settings?.background_mode !== 'carousel' || !settings?.background_images?.length) {
            return;
        }
        
        const interval = setInterval(() => {
            setCarouselIndex((prev) => 
                (prev + 1) % (settings.background_images?.length || 1)
            );
        }, 5000); // Change toutes les 5 secondes
        
        return () => clearInterval(interval);
    }, [settings?.background_mode, settings?.background_images?.length]);

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

    // Convertir menuItems en format pour SpinningTacticalMenu (catégories, icônes et couleurs depuis BDD)
    const { tacticalMenuData, categoryStyles } = useMemo(() => {
        const empty = { tacticalMenuData: { root: [] as Array<{ id: string; label: string; icon?: string; price?: string }> }, categoryStyles: {} as Record<string, { strokeRgba: string; glowRgba: string }> };
        if (!menuItems.length) return empty;

        type CatEntry = { items: Array<{ id: string; label: string; icon?: string; price?: string }>; icon: string; strokeRgba: string; glowRgba: string };
        const categoriesMap = new Map<string, CatEntry>();

        menuItems.forEach((dish) => {
            const catName = dish.category?.name ?? 'Plats';
            const icon = dish.category?.icon ?? '🍽️';
            const strokeRgba = dish.category?.strokeRgba ?? 'rgba(37, 99, 235, 0.3)';
            const glowRgba = dish.category?.glowRgba ?? 'rgba(37, 99, 235, 0.6)';
            if (!categoriesMap.has(catName)) {
                categoriesMap.set(catName, { items: [], icon, strokeRgba, glowRgba });
            }
            categoriesMap.get(catName)!.items.push({
                id: dish.id,
                label: dish.name,
                price: `${dish.price.toFixed(2)}€`
            });
        });

        const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
        const categoryStyles: Record<string, { strokeRgba: string; glowRgba: string }> = {};
        const rootCategories = Array.from(categoriesMap.entries()).map(([name, { icon, strokeRgba, glowRgba }]) => {
            categoryStyles[name] = { strokeRgba, glowRgba };
            return { id: slug(name), label: name, icon };
        });

        const menuStructure: {
            root: Array<{ id: string; label: string; icon?: string; price?: string }>;
            [key: string]: Array<{ id: string; label: string; icon?: string; price?: string }>;
        } = { root: rootCategories };
        categoriesMap.forEach(({ items }, name) => {
            menuStructure[slug(name)] = items;
        });

        return { tacticalMenuData: menuStructure, categoryStyles };
    }, [menuItems]);

    // Afficher un skeleton pendant le chargement
    if (id && itemLoading) {
        return <ARViewerSkeleton />;
    }
    
    if (!id && menuLoading) {
        return <MenuSkeleton />;
    }

    // Determiner le fond a afficher
    const backgroundImages = settings?.background_images || [];
    const backgroundMode = settings?.background_mode || 'gradient';

    // Calculer le style de fond
    const backgroundStyle: React.CSSProperties = {
        backgroundColor: '#000000', // Fond noir par defaut
    };

    if (!isARRoute && backgroundImages.length > 0) {
        if (backgroundMode === 'single') {
            backgroundStyle.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImages[0]})`;
            backgroundStyle.backgroundSize = 'cover';
            backgroundStyle.backgroundPosition = 'center';
        } else if (backgroundMode === 'carousel') {
            backgroundStyle.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImages[carouselIndex]})`;
            backgroundStyle.backgroundSize = 'cover';
            backgroundStyle.backgroundPosition = 'center';
        }
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={backgroundStyle}>
            {/* AR Viewer avec model-viewer fullscreen */}
            {product && product.modelUrl && (
                <ARViewer
                    ref={arViewerRef}
                    modelUrl={product.modelUrl}
                    alt={product.name}
                    hotspots={convertHotspots(product.hotspots || [])}
                    scale={scale}
                    onHotspotClick={handleHotspotClick}
                    onARStatusChange={handleARStatusChange}
                    menuItemId={product.id}
                />
            )}

            {/* Bouton retour au menu - Masque en session AR pour liberer la surface tactile */}
            {product && !showMenu && !isARSessionActive && (
                <motion.button
                    onClick={() => {
                        navigate(-1);
                    }}
                    className="fixed top-4 left-4 z-[60] rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-soft transition-all pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/30 text-primary-600"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Retour au menu précédent"
                >
                    <span className="text-xl sm:text-2xl">←</span>
                </motion.button>
            )}

            {/* Menu Tactique Spinning - affiché quand aucun plat n'est sélectionné */}
            {showMenu && !product && (
                <SpinningTacticalMenu
                    menuData={tacticalMenuData}
                    categoryStyles={categoryStyles}
                    isOpen={showMenu}
                    onClose={() => setShowMenu(false)}
                    onSelectItem={(itemId, _path) => handleTacticalMenuSelect(itemId)}
                    initialCategory={categorySlug}
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
                    isARMode={isARSessionActive}
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
