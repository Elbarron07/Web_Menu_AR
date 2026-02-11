import { useState, useEffect, useMemo } from 'react';
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
            // Flatten all items for search or just filter current level? 
            // Design implies global search or current list filter. 
            // For now, let's filter current list to keep navigation context, or maybe search across all if at root?
            // Simple approach: Filter visible items
            const lowerQuery = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.label.toLowerCase().includes(lowerQuery) ||
                (item.description && item.description.toLowerCase().includes(lowerQuery))
            );
        }

        return items;
    }, [currentLevel, menuData, searchQuery]);

    const handleItemClick = (item: MenuItem) => {
        if (menuData[item.id] && menuData[item.id].length > 0) {
            // C'est une catégorie
            setNavigationPath([...navigationPath, currentLevel]);
            setCurrentLevel(item.id);
            setSearchQuery(''); // Reset search on navigation
        } else {
            // C'est un plat
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
            setSearchQuery('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-end md:justify-center">
            {/* Backdrop / Container - allow clicks on menu but pass through touches on sides? 
                Actually, this is the full menu view, so it should probably block interaction with AR while open?
                The design looks like a full screen or large modal.
                Let's make it a centered modal for consistency with "Vertical Menu".
             */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-md h-[80vh] bg-[#1a1b1e] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl border border-white/5"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="p-6 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        {navigationPath.length > 0 && (
                            <button
                                onClick={handleBack}
                                className="mr-4 text-white/60 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase text-center flex-1">
                            {navigationPath.length > 0 ? (
                                menuData[currentLevel]?.find(i => i.id === currentLevel)?.label || 'MENU'
                            ) : (
                                restaurantInfo?.name || 'MENU'
                            )}
                        </h2>
                        {/* Placeholder for symmetry or close button */}
                        <div className="w-6" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-xl leading-5 bg-[#2c2d31] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#36373b] focus:border-amber-500 transition-colors sm:text-sm"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentLevel + (searchQuery ? '-search' : '')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {currentItems.map((item, index) => {
                                const isCategory = menuData[item.id] && menuData[item.id].length > 0;
                                const style = categoryStyles[item.id] || categoryStyles[currentLevel];

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                                        className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl border border-transparent hover:bg-white/5 transition-all"
                                        style={{
                                            borderColor: style ? style.strokeRgba : 'transparent',
                                            boxShadow: style ? `0 0 10px ${style.strokeRgba.replace('0.3)', '0.05)')}` : 'none'
                                        }}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        {/* Image (Round) */}
                                        <div className="relative w-20 h-20 shrink-0">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.label}
                                                    className="w-full h-full object-cover rounded-full shadow-lg group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-[#2c2d31] flex items-center justify-center text-3xl shadow-lg border border-white/5 group-hover:scale-105 transition-transform duration-300">
                                                    {item.icon || '🍽️'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-lg font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                                    {item.label}
                                                </h3>
                                                {item.price && (
                                                    <span className="text-lg font-medium text-white shrink-0">
                                                        {item.price.replace('€', '')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-end mt-1">
                                                <p className="text-sm text-gray-400 line-clamp-2 pr-4 leading-relaxed">
                                                    {item.description || (isCategory ? 'Voir la catégorie' : 'Une délicieuse création du chef.')}
                                                </p>

                                                {isCategory ? (
                                                    <div className="w-8 h-8 rounded-full bg-[#2c2d31] flex items-center justify-center text-white/60 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-md">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-[#2c2d31] flex items-center justify-center text-white/60 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-md">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {currentItems.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            Aucun résultat trouvé
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
