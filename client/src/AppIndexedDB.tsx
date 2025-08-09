import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Import IndexedDB hooks
import { useDatabase, useAuth, useProducts } from "./hooks/use-indexeddb";
import type { User } from "./lib/indexeddb";

// Import components and pages
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import SyncScreenIndexedDB from "@/pages/SyncScreenIndexedDB";
import ProductCatalog from "@/pages/ProductCatalog";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderDetail from "@/pages/PurchaseOrderDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Account from "@/pages/Account";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderConfirmation from "@/pages/OrderConfirmation";
import NotFound from "@/pages/not-found";

// Cart item type
export interface CartItem {
  ean: string;
  title: string;
  description?: string;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
  image_url?: string;
  quantity: number;
}

function Router() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // IndexedDB hooks
  const { isInitialized, error, clearDatabase } = useDatabase();
  const { currentUser, userStore, login, logout, isAuthenticated } = useAuth();
  const { loadProducts } = useProducts();

  // Application state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSyncScreen, setShowSyncScreen] = useState(false);
  
  // Cart state is managed here
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string>('');

  // Show loading screen while database initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Inicializando Base de Datos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {error ? `Error: ${error}` : 'Preparando IndexedDB...'}
          </p>
        </div>
      </div>
    );
  }

  // Authentication logic
  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await login(email, password);
      
      // Load products after successful login
      await loadProducts();
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${email}`,
      });
      
      setLocation("/catalog");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error de autenticación",
        description: "Credenciales inválidas o datos no sincronizados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCartItems([]);
    setLocation("/");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  // Cart functions
  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ean === item.ean);
      if (existing) {
        return prev.map(i => 
          i.ean === item.ean 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (ean: string) => {
    setCartItems(prev => prev.filter(item => item.ean !== ean));
  };

  const updateCartQuantity = (ean: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(ean);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.ean === ean ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);

  // Sync screen handlers
  const handleShowSync = () => {
    setShowSyncScreen(true);
  };

  const handleSyncComplete = () => {
    setShowSyncScreen(false);
    if (isAuthenticated) {
      setLocation("/catalog");
    }
  };

  // Database management
  const handleClearDatabase = async () => {
    if (confirm("¿Estás seguro de que quieres borrar todos los datos locales?")) {
      try {
        await clearDatabase();
        handleLogout();
        toast({
          title: "Base de datos borrada",
          description: "Todos los datos locales han sido eliminados",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo borrar la base de datos",
          variant: "destructive",
        });
      }
    }
  };

  // Show sync screen if requested
  if (showSyncScreen) {
    return <SyncScreenIndexedDB onSyncComplete={handleSyncComplete} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin}
        onShowSync={handleShowSync}
        isLoading={isLoading}
      />
    );
  }

  // Main app layout
  return (
    <Layout
      user={currentUser}
      store={userStore}
      cartItems={cartItems}
      cartItemCount={cartItemCount}
      cartTotal={cartTotal}
      cartOpen={cartOpen}
      setCartOpen={setCartOpen}
      sideMenuOpen={sideMenuOpen}
      setSideMenuOpen={setSideMenuOpen}
      onLogout={handleLogout}
      onShowSync={handleShowSync}
      onClearDatabase={handleClearDatabase}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      updateCartQuantity={updateCartQuantity}
      clearCart={clearCart}
    >
      <Switch>
        <Route path="/" component={() => <ProductCatalog 
          onAddToCart={addToCart}
          cartItems={cartItems}
          user={currentUser}
        />} />
        
        <Route path="/catalog" component={() => <ProductCatalog 
          onAddToCart={addToCart}
          cartItems={cartItems}
          user={currentUser}
        />} />
        
        <Route path="/purchase-orders" component={() => 
          <PurchaseOrders user={currentUser} />
        } />
        
        <Route path="/purchase-orders/:orderId" component={({ orderId }) => 
          <PurchaseOrderDetail orderId={orderId!} user={currentUser} />
        } />
        
        <Route path="/orders" component={() => 
          <Orders user={currentUser} />
        } />
        
        <Route path="/orders/:orderId" component={({ orderId }) => 
          <OrderDetail orderId={orderId!} user={currentUser} />
        } />
        
        <Route path="/account" component={() => 
          <Account 
            user={currentUser} 
            store={userStore}
            onShowSync={handleShowSync}
            onClearDatabase={handleClearDatabase}
          />
        } />
        
        <Route path="/order-success" component={() => 
          <OrderSuccess 
            user={currentUser}
            orderId={lastOrderId}
          />
        } />
        
        <Route path="/order-confirmation" component={() => 
          <OrderConfirmation 
            cartItems={cartItems}
            cartTotal={cartTotal}
            user={currentUser}
            store={userStore}
            onOrderComplete={(orderId: string) => {
              setLastOrderId(orderId);
              clearCart();
              setLocation("/order-success");
            }}
          />
        } />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}