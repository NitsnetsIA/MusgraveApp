import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Import database hook and types
import { useDatabase } from "@/hooks/use-database";
import type { User, CartItem } from "@shared/schema";

// Import components and pages
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import ProductCatalog from "@/pages/ProductCatalog";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderDetail from "@/pages/PurchaseOrderDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Account from "@/pages/Account";
import OrderSuccess from "@/pages/OrderSuccess";
import NotFound from "@/pages/not-found";

function Router() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    isInitialized,
    authenticateUser,
    getStoreByCode,
    getTaxRate,
    createPurchaseOrder,
    saveDatabase
  } = useDatabase();

  // Application state
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string>('');

  // Load user data when user changes
  useEffect(() => {
    async function loadUserData() {
      if (user?.store_id) {
        const storeData = await getStoreByCode(user.store_id);
        setStore(storeData);
      }
    }
    loadUserData();
  }, [user, getStoreByCode]);

  // Authentication handlers
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const authenticatedUser = await authenticateUser(email, password);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setLocation('/');
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido ${authenticatedUser.name}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStore(null);
    setCartItems([]);
    setSideMenuOpen(false);
    setCartOpen(false);
    setLocation('/login');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  // Cart management
  const addToCart = async (ean: string, quantity: number) => {
    try {
      // Find existing item in cart
      const existingItemIndex = cartItems.findIndex(item => item.ean === ean);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedItems);
      } else {
        // Add new item - we need to get product details first
        const { query } = await import('./lib/database');
        const products = query('SELECT * FROM products WHERE ean = ?', [ean]);
        if (products.length > 0) {
          const product = products[0];
          const taxRate = await getTaxRate(product.tax_code);
          
          const newItem: CartItem = {
            ean: product.ean,
            title: product.title,
            base_price: product.base_price,
            tax_rate: taxRate,
            quantity,
            image_url: product.image_url,
            display_price: product.display_price
          };
          
          setCartItems([...cartItems, newItem]);
        }
      }
      
      toast({
        title: "Producto añadido",
        description: `${quantity} unidades añadidas al carrito`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el producto al carrito",
        variant: "destructive",
      });
    }
  };

  const updateCartItem = (ean: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(ean);
      return;
    }
    
    const updatedItems = cartItems.map(item =>
      item.ean === ean ? { ...item, quantity } : item
    );
    setCartItems(updatedItems);
  };

  const removeFromCart = (ean: string) => {
    const updatedItems = cartItems.filter(item => item.ean !== ean);
    setCartItems(updatedItems);
    toast({
      title: "Producto eliminado",
      description: "Producto eliminado del carrito",
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Checkout handler
  const handleCheckout = async () => {
    if (!user || !store || cartItems.length === 0) {
      toast({
        title: "Error",
        description: "No se puede procesar el pedido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = await createPurchaseOrder(user.email, store.code, cartItems);
      setLastOrderId(orderId);
      clearCart();
      setCartOpen(false);
      setLocation('/order-success');
      
      toast({
        title: "Pedido creado",
        description: "Su orden de compra ha sido creada exitosamente",
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while database initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block bg-musgrave-500 text-white text-2xl font-bold px-4 py-2 rounded transform -rotate-12 mb-4">
            M
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-musgrave-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  // Show login if no user
  if (!user) {
    return (
      <div className="min-h-screen">
        <Login onLogin={handleLogin} isLoading={isLoading} />
      </div>
    );
  }

  // Main application routes
  return (
    <Layout
      user={user}
      store={store}
      onLogout={handleLogout}
      sideMenuOpen={sideMenuOpen}
      setSideMenuOpen={setSideMenuOpen}
      cartOpen={cartOpen}
      setCartOpen={setCartOpen}
      cartItems={cartItems}
      updateCartItem={updateCartItem}
      removeFromCart={removeFromCart}
      clearCart={clearCart}
      onCheckout={handleCheckout}
    >
      <Switch>
        <Route path="/" component={() => <ProductCatalog onAddToCart={addToCart} />} />
        <Route path="/purchase-orders" component={() => <PurchaseOrders user={user} />} />
        <Route path="/purchase-orders/:id" component={PurchaseOrderDetail} />
        <Route path="/orders" component={() => <Orders user={user} />} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/account" component={() => <Account user={user} store={store} />} />
        <Route path="/order-success" component={() => <OrderSuccess orderId={lastOrderId} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
