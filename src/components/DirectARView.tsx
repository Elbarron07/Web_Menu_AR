import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import menuData from '../data/menu.json';
import { useCart } from './CartContext';
import { useCameraStream } from '../hooks/useCameraStream';
import { SimpleMenu } from './SimpleMenu';
import { HotspotInfo } from './HotspotInfo';
import '@google/model-viewer';

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
    const [showMenu, setShowMenu] = useState(!dishId);
    const videoRef = useRef<HTMLVideoElement>(null);
    const modelViewerRef = useRef<any>(null);
    
    const { stream, error: cameraError, startCamera, stopCamera } = useCameraStream();

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
        const newScale = variant.scale || "1 1 1";
        setScale(newScale);
        
        // Mettre à jour l'échelle dans model-viewer
        if (modelViewerRef.current) {
            const scaleParts = newScale.split(' ').map(Number);
            const scaleValue = `${scaleParts[0] || 1} ${scaleParts[1] || 1} ${scaleParts[2] || 1}`;
            (modelViewerRef.current as any).scale = scaleValue;
        }
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

    // Activer la caméra au montage
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    // Connecter le flux vidéo à l'élément video
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
        }
    }, [stream]);

    const handleDishSelect = (dishId: number) => {
        setShowMenu(false);
        setSelectedDishId(dishId);
        navigate(`/ar/${dishId}`);
    };

    // Afficher le menu si aucun plat n'est sélectionné
    useEffect(() => {
        if (!selectedDishId || !product) {
            setShowMenu(true);
        } else {
            setShowMenu(false);
        }
    }, [selectedDishId, product]);

    // Calculer l'échelle pour model-viewer (format "X Y Z" en string)
    const scaleParts = scale.split(' ').map(Number);
    const modelScaleValue = `${scaleParts[0] || 1} ${scaleParts[1] || 1} ${scaleParts[2] || 1}`;
    
    // Note: model-viewer avec ar-scale="fixed" garde la taille du modèle original
    // Le scale est utilisé pour les variants (M, L, etc.)
    // Pour une taille réelle 1:1, le modèle GLTF doit être modélisé à la bonne échelle

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'transparent' }}>
            {/* Flux vidéo de la caméra en arrière-plan */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
                style={{ transform: 'scaleX(-1)' }} // Miroir pour une expérience naturelle
            />

            {/* Menu simple - affiché quand aucun plat n'est sélectionné */}
            {showMenu && !product && (
                <SimpleMenu onSelectDish={handleDishSelect} />
            )}

            {/* Model Viewer pour afficher le plat en 3D avec AR */}
            {product && product.model3D && (
                <model-viewer
                    ref={modelViewerRef}
                    src={product.model3D}
                    alt={product.name}
                    camera-controls
                    auto-rotate
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-scale="fixed"
                    interaction-policy="allow-when-focused"
                    interaction-prompt="auto"
                    touch-action="none"
                    reveal="interaction"
                    shadow-intensity="1"
                    scale={modelScaleValue}
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 10,
                        touchAction: 'none'
                    } as any}
                    className="absolute inset-0 model-viewer-container"
                >
                    {/* Hotspots interactifs améliorés */}
                    {product.hotspots?.map((hotspot: any, idx: number) => (
                        <HotspotInfo
                            key={idx}
                            name={hotspot.name}
                            detail={hotspot.detail}
                            position={hotspot.position}
                            index={idx}
                        />
                    ))}
                </model-viewer>
            )}

            {/* Messages d'erreur caméra */}
            {cameraError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full">
                    Erreur caméra: {cameraError}
                </div>
            )}

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
