import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, type CartItem } from './CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { cart, removeFromCart, clearCart, total } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'confirming' | 'success'>('idle');

    const handleOrder = () => {
        setOrderStatus('confirming');
    };

    const confirmOrder = () => {
        // Générer le résumé de commande
        const orderSummary = cart.map((item: CartItem) =>
            `• ${item.nom} (${item.size}) — ${item.price.toFixed(2)}€`
        ).join('\n');
        const message = `🛒 Nouvelle commande !\n\n${orderSummary}\n\n💰 Total : ${total.toFixed(2)}€`;

        // Copier dans le presse-papier
        navigator.clipboard?.writeText(message).catch(() => { });

        setOrderStatus('success');

        // Reset après 3 secondes
        setTimeout(() => {
            clearCart();
            setOrderStatus('idle');
            setIsCartOpen(false);
        }, 3000);
    };

    const cancelOrder = () => {
        setOrderStatus('idle');
    };

    return (
        <>
            <nav className="fixed top-0 w-full z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">
                        AR Resto
                    </Link>
                    <button
                        onClick={() => { setIsCartOpen(true); setOrderStatus('idle'); }}
                        className="relative p-2 text-white hover:text-amber-400 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        {cart.length > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                            >
                                {cart.length}
                            </motion.span>
                        )}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm cursor-pointer"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 z-50 shadow-2xl border-l border-gray-800 flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                                <h2 className="text-2xl font-bold text-white">Votre Panier</h2>
                                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {orderStatus === 'success' ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-full text-center gap-4"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                            className="text-6xl"
                                        >
                                            ✅
                                        </motion.div>
                                        <h3 className="text-2xl font-bold text-white">Commande confirmée !</h3>
                                        <p className="text-gray-400">
                                            Le résumé a été copié dans votre presse-papier.
                                        </p>
                                        <p className="text-amber-400 text-sm font-medium">
                                            Présentez-le à votre serveur
                                        </p>
                                    </motion.div>
                                ) : cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                                        <span className="text-4xl">🛒</span>
                                        <p>Votre panier est vide</p>
                                        <button onClick={() => setIsCartOpen(false)} className="text-amber-500 hover:underline">
                                            Découvrir le menu
                                        </button>
                                    </div>
                                ) : (
                                    cart.map((item: CartItem) => (
                                        <motion.div
                                            key={item.cartId}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-amber-500/30 transition-colors"
                                        >
                                            <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                                                <img src={item.image || "https://placehold.co/100"} alt={item.nom} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white truncate">{item.nom}</h3>
                                                <p className="text-sm text-gray-400">Taille: {item.size}</p>
                                                <p className="text-amber-500 font-bold">{item.price.toFixed(2)}€</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.cartId)}
                                                className="text-gray-500 hover:text-red-500 self-start p-1"
                                            >
                                                ✕
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-800 bg-gray-900">
                                {orderStatus === 'confirming' ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <p className="text-center text-white font-semibold">
                                            Confirmer la commande ?
                                        </p>
                                        <p className="text-center text-gray-400 text-sm">
                                            {cart.length} article{cart.length > 1 ? 's' : ''} — {total.toFixed(2)}€
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={cancelOrder}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={confirmOrder}
                                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                            >
                                                ✓ Confirmer
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : orderStatus === 'idle' ? (
                                    <>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-gray-400">Total</span>
                                            <span className="text-2xl font-bold text-white">{total.toFixed(2)}€</span>
                                        </div>
                                        <button
                                            onClick={handleOrder}
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={cart.length === 0}
                                        >
                                            Commander Maintenant
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
