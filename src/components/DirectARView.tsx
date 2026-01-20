import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import menuData from '../data/menu.json';
import { useCart } from './CartContext';
import { SimpleMenu } from './SimpleMenu';
import { ARViewer } from './ARViewer';
import { HUDOverlay } from './HUDOverlay';
import { HotspotAnnotation } from './HotspotAnnotation';

const DirectARView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = id ? menuData.find((p: any) => p.id === id) : null;

    const { addToCart } = useCart();

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

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'transparent' }}>
            {/* AR Viewer avec model-viewer fullscreen */}
            {product && product.modelUrl && (
                <ARViewer
                    modelUrl={product.modelUrl}
                    alt={product.name}
                    hotspots={convertHotspots(product.hotspots || [])}
                    scale={scale}
                    onHotspotClick={handleHotspotClick}
                />
            )}

            {/* Menu simple HTML - affiché quand aucun plat n'est sélectionné */}
            {showMenu && !product && (
                <div className="absolute inset-0 z-40">
                    <SimpleMenu onSelectDish={handleDishSelect} />
                </div>
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
