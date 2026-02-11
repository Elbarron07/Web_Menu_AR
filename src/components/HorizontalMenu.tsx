import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    price?: string;
    description?: string;
    image?: string;
}

interface CategoryStyles {
    strokeRgba: string;
    glowRgba: string;
}

interface RestaurantInfo {
    name?: string;
    logo_url?: string;
}

interface HorizontalMenuProps {
    menuData: {
        root: MenuItem[];
        [key: string]: MenuItem[];
    };
    categoryStyles?: Record<string, CategoryStyles>;
    onSelectItem?: (itemId: string, path: string[]) => void;
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: string;
    restaurantInfo?: RestaurantInfo;
}

export const HorizontalMenu = ({
    menuData,
    onSelectItem,
    isOpen,
    onClose,
    categoryStyles = {},
    initialCategory,
    restaurantInfo,
}: HorizontalMenuProps) => {
    const [currentLevel, setCurrentLevel] = useState<string>(initialCategory && menuData[initialCategory] ? initialCategory : 'root');
    const [navigationPath, setNavigationPath] = useState<string[]>(initialCategory && menuData[initialCategory] ? ['root'] : []);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialCategory && menuData[initialCategory]) {
            setCurrentLevel(initialCategory);
            setNavigationPath(['root']);
        } else {
            setCurrentLevel('root');
            setNavigationPath([]);
        }
    }, [initialCategory, menuData]);

    const currentItems = useMemo(() => {
        return menuData[currentLevel] || menuData.root;
    }, [currentLevel, menuData]);

    // Triple items for infinite horizontal scroll
    const extendedItems = useMemo(() => {
        if (currentItems.length < 3) return currentItems;
        return [...currentItems, ...currentItems, ...currentItems];
    }, [currentItems]);

    const isInfinite = currentItems.length >= 3;

    // Handle infinite scroll: jump to middle set when nearing edges
    const handleScroll = useCallback(() => {
        if (!scrollRef.current || !isInfinite) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const oneSetWidth = scrollWidth / 3;
        const maxScroll = scrollWidth - clientWidth;

        // If we're near the left edge (including at 0), jump forward
        if (scrollLeft <= oneSetWidth * 0.4) {
            scrollRef.current.scrollLeft = scrollLeft + oneSetWidth;
        }
        // If we're near the right edge (including at max), jump backward
        else if (scrollLeft >= maxScroll - oneSetWidth * 0.4 || scrollLeft >= oneSetWidth * 2.1) {
            scrollRef.current.scrollLeft = scrollLeft - oneSetWidth;
        }
    }, [isInfinite]);

    // Center scroll on mount/category change (retry until it works)
    useEffect(() => {
        if (!isInfinite) return;

        let attempts = 0;
        const maxAttempts = 10;

        const tryCenter = () => {
            if (!scrollRef.current || attempts >= maxAttempts) return;
            attempts++;
            const oneSetWidth = scrollRef.current.scrollWidth / 3;
            if (oneSetWidth > 0) {
                scrollRef.current.scrollLeft = oneSetWidth;
            }
        };

        // Try multiple times: immediately, RAF, and with increasing delays
        tryCenter();
        requestAnimationFrame(tryCenter);
        const t1 = setTimeout(tryCenter, 50);
        const t2 = setTimeout(tryCenter, 150);
        const t3 = setTimeout(tryCenter, 300);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [currentLevel, currentItems, isInfinite]);

    const handleItemClick = (item: MenuItem) => {
        if (menuData[item.id] && menuData[item.id].length > 0) {
            setNavigationPath([...navigationPath, currentLevel]);
            setCurrentLevel(item.id);
        } else {
            if (onSelectItem) {
                onSelectItem(item.id, [...navigationPath, currentLevel]);
            }
            onClose();
        }
    };

    const handleBack = () => {
        if (navigationPath.length > 0) {
            const prev = navigationPath[navigationPath.length - 1];
            setNavigationPath(navigationPath.slice(0, -1));
            setCurrentLevel(prev);
        }
    };

    const currentTitle = useMemo(() => {
        if (navigationPath.length > 0) {
            const parentLevel = navigationPath[navigationPath.length - 1];
            const parentItems = menuData[parentLevel] || menuData.root;
            const found = parentItems.find(i => i.id === currentLevel);
            return found?.label || 'Menu';
        }
        return restaurantInfo?.name || 'Menu';
    }, [currentLevel, navigationPath, menuData, restaurantInfo]);

    if (!isOpen) return null;

    const displayItems = isInfinite ? extendedItems : currentItems;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0f]">
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    {navigationPath.length > 0 ? (
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-amber-500/20">
                            🍔
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">
                            {currentTitle}
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {currentItems.length} {currentItems.length > 1 ? 'éléments' : 'élément'} • Défilement infini
                        </p>
                    </div>
                </div>
            </div>

            {/* Horizontal Carousel with Infinite Scroll */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden relative">
                {/* Gradient masks for infinite effect */}
                {isInfinite && (
                    <>
                        <div className="absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-[#0d0d0f] to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-[#0d0d0f] to-transparent z-10 pointer-events-none" />
                    </>
                )}

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-5 overflow-x-auto px-6 pb-6 pt-2 items-stretch"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}
                >
                    <AnimatePresence mode="popLayout">
                        {displayItems.map((item, index) => {
                            const isCategory = menuData[item.id] && menuData[item.id].length > 0;
                            const style = categoryStyles[item.id] || categoryStyles[currentLevel];
                            const uniqueKey = `${item.id}-${index}`;

                            return (
                                <motion.button
                                    key={uniqueKey}
                                    onClick={() => handleItemClick(item)}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
                                    whileTap={{ scale: 0.97 }}
                                    className="relative flex-shrink-0 w-72 rounded-3xl overflow-hidden group snap-center text-left flex flex-col"
                                    style={{
                                        background: 'linear-gradient(180deg, #1e1f23 0%, #121214 100%)',
                                        border: style ? `1.5px solid ${style.strokeRgba}` : '1.5px solid rgba(255,255,255,0.06)',
                                        boxShadow: style
                                            ? `0 8px 32px ${style.glowRgba.replace('0.6)', '0.15)')}, 0 2px 8px rgba(0,0,0,0.5)`
                                            : '0 2px 8px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {/* Image area */}
                                    <div className="relative w-full h-52 bg-[#1a1b1f] overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.label}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"
                                                style={{
                                                    background: style
                                                        ? `radial-gradient(circle at 50% 60%, ${style.glowRgba.replace('0.6)', '0.2)')}, transparent 70%)`
                                                        : 'radial-gradient(circle at 50% 60%, rgba(251,191,36,0.1), transparent 70%)'
                                                }}
                                            >
                                                <span className="text-7xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                                                    {item.icon || '🍽️'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/30 to-transparent" />
                                        {isCategory && (
                                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full p-1.5">
                                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between -mt-4 relative">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">
                                                {item.label}
                                            </h3>
                                            {item.description && !isCategory && (
                                                <p className="text-sm text-gray-400 line-clamp-2 mt-2 leading-relaxed">{item.description}</p>
                                            )}
                                            {isCategory && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {menuData[item.id]?.length || 0} plats disponibles
                                                </p>
                                            )}
                                        </div>

                                        {item.price ? (
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-xl font-bold text-amber-400">{item.price}</span>
                                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                                                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex items-center gap-2 text-amber-400/70">
                                                <span className="text-sm font-semibold uppercase tracking-wider">Explorer</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
