import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMenu } from '../hooks/useMenu';

const MenuGrid = () => {
    const { menuItems, loading } = useMenu();
    
    // Extract unique category names (from BDD)
    const categories = Array.from(new Set(menuItems.map((p) => p.category?.name).filter(Boolean))) as string[];

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 pb-24">
                <div className="text-center py-20 text-2xl text-white">Chargement du menu...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    Smart Menu AR
                </h1>
                <p className="text-gray-400 text-lg">Découvrez nos plats en 3D avant de commander</p>
            </div>

            {categories.map((category: any) => (
                <section key={category} className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-white">{category}</h2>
                        <div className="h-px bg-gray-700 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {menuItems.filter((p) => p.category?.name === category).map((plat) => (
                            <motion.div
                                key={plat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                whileHover={{ y: -8 }}
                                className="group bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10 transition-all"
                            >
                                <div className="h-64 bg-gray-700 relative overflow-hidden">
                                    <img
                                        src={plat.image2D}
                                        alt={plat.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-amber-400 font-bold border border-white/10 shadow-lg">
                                        {plat.price.toFixed(2)}€
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{plat.name}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-2">{plat.shortDesc}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 border-t border-gray-700/50 pt-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span>🔥</span> {plat.nutrition.calories} kcal
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>⏱️</span> {plat.nutrition.temps}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/item/${plat.id}`}
                                        className="w-full mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                                    >
                                        <span>Voir en 3D</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default MenuGrid;
