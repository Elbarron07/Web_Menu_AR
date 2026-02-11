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

interface VerticalMenuProps {
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

export const VerticalMenu = ({
    menuData,
    onSelectItem,
    isOpen,
    onClose,
    categoryStyles = {},
    initialCategory,
    restaurantInfo,
}: VerticalMenuProps) => {
    const [currentLevel, setCurrentLevel] = useState<string>(initialCategory && menuData[initialCategory] ? initialCategory : 'root');
    const [navigationPath, setNavigationPath] = useState<string[]>(initialCategory && menuData[initialCategory] ? ['root'] : []);
    const [searchQuery, setSearchQuery] = useState('');
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
        let items = menuData[currentLevel] || menuData.root;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.label.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
            );
        }
        return items;
    }, [currentLevel, menuData, searchQuery]);

    // Triple items for infinite scroll effect (only if enough items)
    const extendedItems = useMemo(() => {
        if (currentItems.length < 4) return currentItems;
        return [...currentItems, ...currentItems, ...currentItems];
    }, [currentItems]);

    const isInfinite = currentItems.length >= 4;

    // Handle infinite scroll: jump to middle set when nearing edges
    const handleScroll = useCallback(() => {
        if (!scrollRef.current || !isInfinite) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const oneSetHeight = scrollHeight / 3;
        const maxScroll = scrollHeight - clientHeight;

        // Near top edge (including at 0), jump forward
        if (scrollTop <= oneSetHeight * 0.4) {
            scrollRef.current.scrollTop = scrollTop + oneSetHeight;
        }
        // Near bottom edge (including at max), jump backward
        else if (scrollTop >= maxScroll - oneSetHeight * 0.4 || scrollTop >= oneSetHeight * 2.1) {
            scrollRef.current.scrollTop = scrollTop - oneSetHeight;
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
            const oneSetHeight = scrollRef.current.scrollHeight / 3;
            if (oneSetHeight > 0) {
                scrollRef.current.scrollTop = oneSetHeight;
            }
        };

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
            setSearchQuery('');
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
            setSearchQuery('');
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

    const isRootLevel = navigationPath.length === 0;
    const displayItems = isInfinite && !searchQuery.trim() ? extendedItems : currentItems;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0f]">
            {/* Header */}
            <div className="shrink-0 px-5 pt-6 pb-3">
                <div className="flex items-center gap-3 mb-4">
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
                    <h1 className="text-2xl font-extrabold text-white tracking-tight truncate">
                        {currentTitle}
                    </h1>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all text-sm"
                        placeholder="Rechercher un plat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Gradient masks for infinite scroll effect */}
            <div className="relative flex-1 overflow-hidden">
                {isInfinite && !searchQuery.trim() && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0d0d0f] to-transparent z-10 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0d0d0f] to-transparent z-10 pointer-events-none" />
                    </>
                )}

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto px-4 pb-24"
                    style={{ scrollBehavior: 'auto' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentLevel + searchQuery}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-3 pt-2"
                        >
                            {displayItems.map((item, index) => {
                                const isCategory = menuData[item.id] && menuData[item.id].length > 0;
                                const style = categoryStyles[item.id] || categoryStyles[currentLevel];
                                const uniqueKey = `${item.id}-${index}`;

                                return (
                                    <motion.button
                                        key={uniqueKey}
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(index, 8) * 0.04, type: 'spring', stiffness: 400, damping: 30 } }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => handleItemClick(item)}
                                        className="relative rounded-2xl overflow-hidden group text-left flex flex-col"
                                        style={{
                                            background: isCategory
                                                ? 'linear-gradient(135deg, #1e1f23 0%, #16171a 100%)'
                                                : '#16171a',
                                            border: style ? `1px solid ${style.strokeRgba}` : '1px solid rgba(255,255,255,0.06)',
                                            boxShadow: style ? `0 4px 20px ${style.strokeRgba.replace('0.3)', '0.08)')}` : 'none',
                                        }}
                                    >
                                        {/* Image / Icon area */}
                                        <div className={`relative w-full overflow-hidden ${isRootLevel && isCategory ? 'h-28' : 'h-36'} bg-[#1a1b1f]`}>
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.label}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"
                                                    style={{
                                                        background: style
                                                            ? `radial-gradient(circle at center, ${style.glowRgba.replace('0.6)', '0.15)')}, transparent 70%)`
                                                            : 'radial-gradient(circle at center, rgba(251,191,36,0.08), transparent 70%)'
                                                    }}
                                                >
                                                    <span className="text-5xl drop-shadow-xl group-hover:scale-110 transition-transform duration-300">
                                                        {item.icon || '🍽️'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#16171a] via-transparent to-transparent opacity-60" />
                                            {isCategory && (
                                                <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                                                    <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Explorer</span>
                                                    <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Text content */}
                                        <div className="p-3 flex-1 flex flex-col justify-between">
                                            <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors leading-tight">
                                                {item.label}
                                            </h3>
                                            {item.description && !isCategory && (
                                                <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-snug">{item.description}</p>
                                            )}
                                            {item.price && (
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-amber-400 font-bold text-sm">{item.price}</span>
                                                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                                                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            {isCategory && !item.price && (
                                                <div className="mt-2 flex items-center gap-1">
                                                    <span className="text-[11px] text-gray-500 font-medium">
                                                        {menuData[item.id]?.length || 0} items
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {currentItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-sm">Aucun résultat trouvé</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
