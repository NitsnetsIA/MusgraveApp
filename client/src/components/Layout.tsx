import { ReactNode } from 'react';
import Header from './Header';
import SideMenu from './SideMenu';
import Cart from './Cart';
import { useDatabase } from '@/hooks/use-database';

interface LayoutProps {
  children: ReactNode;
  user?: any;
  store?: any;
  onLogout: () => void;
  sideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartItems: any[];
  updateCartItem: (ean: string, quantity: number) => void;
  removeFromCart: (ean: string) => void;
  clearCart: () => void;
  onCheckout: () => void;
}

export default function Layout({
  children,
  user,
  store,
  onLogout,
  sideMenuOpen,
  setSideMenuOpen,
  cartOpen,
  setCartOpen,
  cartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  onCheckout
}: LayoutProps) {
  const { isOffline } = useDatabase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm">
          <i className="fas fa-wifi-slash mr-2"></i>
          SIN CONEXIÓN - Trabajando en modo offline
        </div>
      )}

      <Header
        user={user}
        store={store}
        isOffline={isOffline}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onMenuToggle={() => setSideMenuOpen(true)}
        onCartToggle={() => setCartOpen(true)}
      />

      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        user={user}
        store={store}
        onLogout={onLogout}
      />

      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartItem}
        onRemoveItem={removeFromCart}
        onCheckout={onCheckout}
        store={store}
      />

      <main>{children}</main>
    </div>
  );
}
