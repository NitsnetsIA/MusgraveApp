import { useState, useEffect, useMemo, useRef } from "react";
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
import SyncScreen from "@/pages/SyncScreen";
import ProductCatalog from "@/pages/ProductCatalog";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderDetail from "@/pages/PurchaseOrderDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Account from "@/pages/Account";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderConfirmation from "@/pages/OrderConfirmation";
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
    getProducts,
    saveDatabase
  } = useDatabase();

  // Application state
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSyncScreen, setShowSyncScreen] = useState(false);
  const [selectedSyncEntities, setSelectedSyncEntities] = useState<string[]>(['taxes', 'products', 'stores', 'deliveryCenters']);
  
  // Cart state is managed here
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
  }, [user]); // Remove getStoreByCode from dependencies to prevent infinite loop

  // Authentication handlers
  const handleLogin = async (email: string, password: string, syncEntities: string[] = ['taxes', 'products', 'stores', 'deliveryCenters']): Promise<boolean> => {
    console.log('handleLogin called with:', { email, password, syncEntities });
    setIsLoading(true);
    try {
      const authenticatedUser = await authenticateUser(email, password);
      console.log('authenticatedUser result:', authenticatedUser);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setSelectedSyncEntities(syncEntities);
        
        // Show sync screen after successful login
        setShowSyncScreen(true);
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
    setShowSyncScreen(false);
    setLocation('/login');
    // Removed logout toast message
  };

  const handleSyncComplete = () => {
    setShowSyncScreen(false);
    setLocation('/');
  };

  // Cart management - simplified without debouncing
  const addToCart = async (ean: string, quantity: number) => {
    try {
      // Find existing item in cart
      const existingItemIndex = cartItems.findIndex(item => item.ean === ean);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity without moving position to reduce DOM changes
        setCartItems(prevItems => 
          prevItems.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        // Add new item - get product details first
        const { query } = await import('./lib/database');
        const products = query(`SELECT * FROM products WHERE ean = '${ean}'`);
        if (products.length > 0) {
          const product = products[0];
          const taxRate = await getTaxRate(product.tax_code);
          
          const newItem: CartItem = {
            ean: product.ean,
            title: product.title,
            base_price: product.base_price,
            tax_rate: taxRate,
            quantity,
            image_url: product.image_url
          };
          
          // Add new item at the end to minimize DOM restructuring
          setCartItems(prev => [...prev, newItem]);
        }
      }
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
    
    // Only update if quantity actually changed to prevent unnecessary re-renders
    const currentItem = cartItems.find(item => item.ean === ean);
    if (currentItem && currentItem.quantity === quantity) {
      return; // No change needed
    }
    
    const updatedItems = cartItems.map(item =>
      item.ean === ean ? { ...item, quantity } : item
    );
    setCartItems(updatedItems);
  };

  const removeFromCart = (ean: string) => {
    const updatedItems = cartItems.filter(item => item.ean !== ean);
    setCartItems(updatedItems);
    // Removed product removed toast message
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Clean cart of invalid products (products that no longer exist)
  const cleanInvalidCartItems = async () => {
    const validItems: any[] = [];
    const removedItems: string[] = [];

    for (const item of cartItems) {
      const product = await getProductByEan(item.ean);
      if (product) {
        validItems.push(item);
      } else {
        removedItems.push(item.title || item.ean);
      }
    }

    if (removedItems.length > 0) {
      setCartItems(validItems);
      console.log(`🧹 Removed ${removedItems.length} invalid products from cart:`, removedItems);
      
      toast({
        title: "Productos eliminados del carrito",
        description: `Se eliminaron ${removedItems.length} productos que ya no están disponibles`,
        variant: "default",
      });
    }
  };

  // Create test cart with 30 random products
  const createTestCart = async () => {
    try {
      const products = await getProducts();
      if (products.length === 0) {
        toast({
          title: "Error",
          description: "No hay productos disponibles",
          variant: "destructive",
        });
        return;
      }

      // Clear current cart
      setCartItems([]);

      // Select 30 random products
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, Math.min(30, products.length));

      // Create cart items with random quantities (1-5)
      const testCartItems: CartItem[] = selectedProducts.map(product => ({
        ean: product.ean,
        title: product.title,
        base_price: Number(product.base_price) || 0,
        tax_rate: Number(product.tax_rate) || 0.21, // Default to 21% if missing
        quantity: Math.floor(Math.random() * 5) + 1, // Random quantity 1-5
        image_url: product.image_url
      }));

      console.log('Test cart items created:', testCartItems.map(item => ({
        title: item.title,
        base_price: item.base_price,
        tax_rate: item.tax_rate
      })));

      setCartItems(testCartItems);
      
      // Test cart created - no notification needed
    } catch (error) {
      console.error('Error creating test cart:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el carrito de test",
        variant: "destructive",
      });
    }
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
      
      // Navigate to order confirmation page
      setLocation(`/order-confirmation/${orderId}`);
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

  // Show sync screen after login
  if (showSyncScreen) {
    return (
      <div className="min-h-screen">
        <SyncScreen 
          onSyncComplete={handleSyncComplete} 
          selectedEntities={selectedSyncEntities}
        />
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
      addToCart={addToCart}
      clearCart={clearCart}
      onCheckout={handleCheckout}
      onCreateTestCart={createTestCart}
    >
      <Switch>
        <Route path="/" component={() => (
          <ProductCatalog 
            cartItems={cartItems}
            onAddToCart={addToCart} 
            onUpdateCart={updateCartItem}
            onRemoveFromCart={removeFromCart}
          />
        )} />
        <Route path="/purchase-orders" component={() => <PurchaseOrders user={user} />} />
        <Route path="/purchase-orders/:id" component={PurchaseOrderDetail} />
        <Route path="/orders" component={() => <Orders user={user} />} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/account" component={() => <Account user={user} store={store} />} />
        <Route path="/order-success" component={() => <OrderSuccess orderId={lastOrderId} />} />
        <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
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
