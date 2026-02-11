import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ───
export interface CartItem {
    cartId: number;
    id: string;
    nom: string;
    image: string;
    size: string;
    price: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: { id: string; nom: string; image: string }, size: string, price: number) => void;
    removeFromCart: (cartId: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = useCallback((item: { id: string; nom: string; image: string }, size: string, price: number) => {
        setCart((prev) => [...prev, { ...item, size, price, cartId: Date.now() }]);
    }, []);

    const removeFromCart = useCallback((cartId: number) => {
        setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const itemCount = cart.length;

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart doit être utilisé dans un CartProvider');
    }
    return context;
};
