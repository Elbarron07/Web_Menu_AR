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

    const handleItemClick = (item: MenuItem) => {
        if (menuData[item.id] && menuData[item.id].length > 0) {
            setNavigationPath([...navigationPath, currentLevel]);
            setCurrentLevel(item.id);
            // Reset scroll on navigation
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
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
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-center items-center overflow-hidden">
            <div className="w-full max-w-6xl px-4 flex flex-col gap-8">

                <div className="flex items-center justify-between px-4">
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
                        <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            {restaurantInfo?.name || 'Menu'}
                        </div>
                    )}
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <AnimatePresence mode="popLayout">
                        {currentItems.map((item, index) => {
                            const style = categoryStyles[item.id] || categoryStyles[currentLevel];
                            const isCategory = menuData[item.id] && menuData[item.id].length > 0;

                            return (
                                <motion.button
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        x: 0,
                                        transition: {
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                        }
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative flex-shrink-0 w-64 h-80 bg-gray-800/60 rounded-3xl border border-white/10 overflow-hidden group snap-center hover:bg-gray-700/60 transition-all flex flex-col"
                                    style={{
                                        borderColor: style ? style.strokeRgba : 'rgba(255,255,255,0.1)',
                                        boxShadow: style ? `0 0 20px ${style.glowRgba}` : 'none'
                                    }}
                                >
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
                                        {item.icon && (
                                            <span className="text-6xl filter drop-shadow-xl group-hover:scale-110 transition-transform duration-300 transform">
                                                {item.icon}
                                            </span>
                                        )}

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                                                {item.label}
                                            </h3>
                                            {item.price && (
                                                <p className="text-amber-400 font-semibold text-lg">{item.price}</p>
                                            )}
                                        </div>
                                    </div>

                                    {isCategory && (
                                        <div className="bg-white/5 p-3 flex justify-center border-t border-white/5">
                                            <span className="text-xs text-white/50 uppercase tracking-widest font-bold group-hover:text-white transition-colors">
                                                Explorer
                                            </span>
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Scroll indicators helper */}
                <div className="flex justify-center gap-2">
                    {currentItems.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    ))}
                </div>
            </div>
        </div>
    );
};
