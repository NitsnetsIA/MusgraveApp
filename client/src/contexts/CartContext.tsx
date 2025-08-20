import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import type { CartItem } from '@shared/schema';

interface CartState {
  items: CartItem[];
  isPending: boolean;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { ean: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_PENDING'; payload: boolean };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(item => item.ean === action.payload.ean);
      if (existingItemIndex >= 0) {
        // Update existing item quantity - create new array only for the changed item
        const newItems = [...state.items];
        newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity: newItems[existingItemIndex].quantity + action.payload.quantity };
        return {
          ...state,
          items: newItems
        };
      } else {
        // Add new item
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      }
    
    case 'UPDATE_ITEM':
      // Only create new array if quantity actually changed
      const updateIndex = state.items.findIndex(item => item.ean === action.payload.ean);
      if (updateIndex >= 0 && state.items[updateIndex].quantity !== action.payload.quantity) {
        const newItems = [...state.items];
        newItems[updateIndex] = { ...newItems[updateIndex], quantity: action.payload.quantity };
        return {
          ...state,
          items: newItems
        };
      }
      return state; // No change needed
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.ean !== action.payload)
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'SET_CART':
      return {
        ...state,
        items: action.payload
      };

    case 'SET_PENDING':
      return {
        ...state,
        isPending: action.payload
      };
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addToCart: (item: CartItem) => void;
  updateCartItem: (ean: string, quantity: number) => void;
  removeFromCart: (ean: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  setPending: (pending: boolean) => void;
  getCartQuantity: (ean: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isPending: false
  });

  // Define functions at the top level (following React rules)
  const addToCart = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const updateCartItem = useCallback((ean: string, quantity: number) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { ean, quantity } });
  }, []);

  const removeFromCart = useCallback((ean: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: ean });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const setCart = useCallback((items: CartItem[]) => {
    dispatch({ type: 'SET_CART', payload: items });
  }, []);

  const setPending = useCallback((pending: boolean) => {
    dispatch({ type: 'SET_PENDING', payload: pending });
  }, []);

  const getCartQuantity = useCallback((ean: string) => {
    const item = state.items.find(item => item.ean === ean);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: CartContextType = useMemo(() => ({
    state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setCart,
    setPending,
    getCartQuantity
  }), [state, addToCart, updateCartItem, removeFromCart, clearCart, setCart, setPending, getCartQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
