import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    price?: string;
}

interface CategoryStyles {
    strokeRgba: string;
    glowRgba: string;
}

interface RestaurantInfo {
    name?: string;
    logo_url?: string;
}

interface InfiniteGridMenuProps {
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

export const InfiniteGridMenu = ({
    menuData,
    onSelectItem,
    isOpen,
    onClose,
    categoryStyles = {},
    initialCategory,
    restaurantInfo,
}: InfiniteGridMenuProps) => {
    const [currentLevel, setCurrentLevel] = useState<string>(initialCategory && menuData[initialCategory] ? initialCategory : 'root');
    const [navigationPath, setNavigationPath] = useState<string[]>(initialCategory && menuData[initialCategory] ? ['root'] : []);
    const scrollContainerRef = useRef<HTMLDivElement>(null);


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

    // Triple the items to create infinite loop illusion
    const extendedItems = useMemo(() => {
        if (currentItems.length < 6) return currentItems; // Don't infinite scroll if few items
        return [...currentItems, ...currentItems, ...currentItems];
    }, [currentItems]);

    // Handle Infinite Scroll
    const handleScroll = () => {
        if (!scrollContainerRef.current || currentItems.length < 6) return;

        const { scrollTop, scrollHeight } = scrollContainerRef.current;
        const oneSetHeight = scrollHeight / 3;

        if (scrollTop < oneSetHeight / 2) {
            scrollContainerRef.current.scrollTop += oneSetHeight;
        } else if (scrollTop > oneSetHeight * 2.5) {
            scrollContainerRef.current.scrollTop -= oneSetHeight;
        }
    };

    // Center scroll on mount/update
    useEffect(() => {
        if (scrollContainerRef.current && currentItems.length >= 6) {
            const oneSetHeight = scrollContainerRef.current.scrollHeight / 3;
            scrollContainerRef.current.scrollTop = oneSetHeight;
        }
    }, [currentLevel, currentItems]);

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
            const previousLevel = navigationPath[navigationPath.length - 1];
            setNavigationPath(navigationPath.slice(0, -1));
            setCurrentLevel(previousLevel);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col pt-24 pb-10 px-4 overflow-hidden">
            <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-8 px-2">
                    {navigationPath.length > 0 ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Retour</span>
                        </button>
                    ) : (
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            {restaurantInfo?.name || 'Menu'}
                        </h2>
                    )}
                </div>

                {/* Gradient Masks for Infinite Effect */}
                <div className="relative flex-1 overflow-hidden mask-linear-fade">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="h-full overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 gap-4 pb-24 pt-4"
                        style={{ scrollBehavior: 'auto' }} // auto needed for instant jump
                    >
                        <AnimatePresence mode="popLayout">
                            {extendedItems.map((item, index) => {
                                // Add unique key for extended items
                                const uniqueKey = `${item.id}-${index}`;
                                const style = categoryStyles[item.id] || categoryStyles[currentLevel];
                                const isCategory = menuData[item.id] && menuData[item.id].length > 0;

                                return (
                                    <motion.button
                                        key={uniqueKey}
                                        onClick={() => handleItemClick(item)}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative aspect-square bg-gray-800/60 rounded-3xl border border-white/10 overflow-hidden group hover:bg-gray-700/60 transition-all flex flex-col"
                                        style={{
                                            borderColor: style ? style.strokeRgba : 'rgba(255,255,255,0.1)',
                                            boxShadow: style ? `0 0 15px ${style.glowRgba}` : 'none'
                                        }}
                                    >
                                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 text-center">
                                            {item.icon && (
                                                <span className="text-5xl filter drop-shadow-xl group-hover:scale-110 transition-transform duration-300">
                                                    {item.icon}
                                                </span>
                                            )}

                                            <div className="min-w-0 w-full">
                                                <h3 className="text-lg font-bold text-white truncate px-2 group-hover:text-amber-400 transition-colors">
                                                    {item.label}
                                                </h3>
                                                {item.price && (
                                                    <p className="text-amber-400 font-semibold text-sm mt-1">{item.price}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isCategory && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
