import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full text-center space-y-6"
            >
                <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="text-8xl font-extrabold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent"
                >
                    404
                </motion.div>
                <h1 className="text-2xl font-bold text-white">
                    Page introuvable
                </h1>
                <p className="text-gray-400">
                    La page que vous cherchez n'existe pas ou a été déplacée.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl transition-all shadow-lg"
                    >
                        Voir le menu
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700"
                    >
                        Retour
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
