import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  name_bn: string;
  price: number;
  image_url: string | null;
  weight: string | null;
  quantity: number;
  requires_advance_payment?: boolean;
  advance_percent?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  /** Sum of advance amounts for items where requires_advance_payment is true */
  advanceTotal: number;
  /** totalPrice minus advanceTotal — to be paid on delivery */
  dueOnDelivery: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const calcItemAdvance = (item: CartItem): number => {
  if (!item.requires_advance_payment) return 0;
  const pct = Math.min(100, Math.max(0, Number(item.advance_percent ?? 50)));
  return Math.round((item.price * item.quantity * pct) / 100);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const advanceTotal = items.reduce((sum, i) => sum + calcItemAdvance(i), 0);
  const dueOnDelivery = Math.max(0, totalPrice - advanceTotal);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, advanceTotal, dueOnDelivery }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
