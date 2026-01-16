import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: any, size: string, price: number) => {
        setCart((prev: any[]) => [...prev, { ...item, size, price, cartId: Date.now() }]);
    };

    const removeFromCart = (cartId: number) => {
        setCart((prev: any[]) => prev.filter((item) => item.cartId !== cartId));
    };

    const total = cart.reduce((acc: number, item: any) => acc + item.price, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, total }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
