import { useState, useEffect, useMemo, useRef, useTransition, useReducer, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { CartProvider, useCart } from "@/contexts/CartContext";

// Import database hook and types
import { useDatabase } from "@/hooks/use-database";
import type { User } from "@shared/schema";

// Import components and pages
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import SyncScreen from "@/pages/SyncScreen";
import SyncScreenSimple from "@/pages/SyncScreenSimple";
import ProductCatalog from "@/pages/ProductCatalog";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderDetail from "@/pages/PurchaseOrderDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Account from "@/pages/Account";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderConfirmation from "@/pages/OrderConfirmation";
import ProductDetail from "@/pages/ProductDetail";
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

  } = useDatabase();

  // Application state
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<any>(null);

  const [showSyncScreen, setShowSyncScreen] = useState(false);
  const [selectedSyncEntities, setSelectedSyncEntities] = useState<string[]>(['taxes', 'products', 'deliveryCenters', 'stores', 'users']);
  
  // Cart state is managed here
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Use cart context instead of local state
  const { state: cartState, addToCart, updateCartItem, removeFromCart, clearCart, setCart, setPending } = useCart();
  const cartItems = cartState.items;

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
  const handleLogin = async (email: string, password: string, syncEntities: string[] = ['taxes', 'products', 'deliveryCenters', 'stores', 'users'], storageType: 'indexeddb' = 'indexeddb'): Promise<boolean> => {
    console.log('handleLogin called with:', { email, password, syncEntities, storageType });
    setIsLoading(true);
    
    // Set storage type for unified database service
    const { setStorageType } = await import('@/lib/database-service');
    setStorageType(storageType);
    
    try {
      const authenticatedUser = await authenticateUser(email, password);
      console.log('authenticatedUser result:', authenticatedUser);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setSelectedSyncEntities(syncEntities);
        
        // Show sync screen after successful login - IndexedDB only
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
    clearCart();
    setSideMenuOpen(false);
    setCartOpen(false);
    setShowSyncScreen(false);
    setLocation('/login');
    // Removed logout toast message
  };

  const handleSyncComplete = async () => {
    // After sync is complete, reload store data
    if (user?.store_id) {
      try {
        const storeData = await getStoreByCode(user.store_id);
        setStore(storeData);
        console.log('Store data loaded after sync:', storeData);
      } catch (error) {
        console.error('Error loading store data after sync:', error);
      }
    }
    
    setShowSyncScreen(false);
    setLocation('/');
  };

  // Cart management - using context to prevent unnecessary re-renders
  const handleAddToCart = async (ean: string, quantity: number) => {
    try {
      setPending(true);
      
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.ean === ean);
      
      if (existingItem) {
        // Update existing item quantity
        updateCartItem(ean, existingItem.quantity + quantity);
      } else {
        // Add new item - get product details using unified service
        const { UnifiedDatabaseService } = await import('./lib/database-service');
        const product = await UnifiedDatabaseService.getProductByEan(ean);
        if (product) {
          const taxRate = await UnifiedDatabaseService.getTaxRate(product.tax_code);
          
          // DEBUG: Log product ref before adding to cart
          console.log(`🛒 Adding product to cart:`, {
            ean: product.ean,
            ref: product.ref,
            ref_type: typeof product.ref,
            title: product.title?.substring(0, 30)
          });
          
          const newItem = {
            ean: product.ean,
            ref: product.ref,
            title: product.title,
            description: product.description,
            base_price: product.base_price,
            tax_rate: taxRate || 0.21, // Default IVA rate if not found
            quantity,
            unit_of_measure: product.unit_of_measure,
            quantity_measure: product.quantity_measure,
            image_url: product.image_url
          };
          
          console.log(`✅ Cart item created with ref:`, newItem.ref);
          
          // Add new item using context
          addToCart(newItem);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el producto al carrito",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  const handleUpdateCartItem = (ean: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(ean);
      return;
    }
    
    // Only update if quantity actually changed to prevent unnecessary re-renders
    const currentItem = cartItems.find(item => item.ean === ean);
    if (currentItem && currentItem.quantity === quantity) {
      return; // No change needed
    }
    
    updateCartItem(ean, quantity);
  };

  const handleRemoveFromCart = (ean: string) => {
    removeFromCart(ean);
    // Removed product removed toast message
  };

  const handleClearCart = () => {
    clearCart();
  };

  // Removed automatic cart cleaning function for better checkout performance

  // Create test cart with only ACTIVE products
  const createTestCart = async () => {
    try {
      // Get only ACTIVE products using unified service
      const { UnifiedDatabaseService } = await import('./lib/database-service');
      const activeProducts = await UnifiedDatabaseService.getProducts();
      
      if (activeProducts.length === 0) {
        toast({
          title: "Error",
          description: "No hay productos activos disponibles",
          variant: "destructive",
        });
        return;
      }

            // Clear current cart
      clearCart();

      // Select exactly 30 random ACTIVE products
      const shuffled = [...activeProducts].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, Math.min(30, activeProducts.length));

      // Create cart items with random quantities (1-3)
      const testCartItems = selectedProducts.map(product => {
        const taxRate = Number(product.tax_rate) || 0.21;
        return {
          ean: product.ean,
          ref: product.ref, // FIXED: Include ref field for test cart items
          title: product.title,
          description: product.description,
          base_price: Number(product.base_price) || 0,
          tax_rate: taxRate,
          quantity: Math.floor(Math.random() * 3) + 1, // Random quantity 1-3
          unit_of_measure: product.unit_of_measure,
          quantity_measure: product.quantity_measure,
          image_url: product.image_url
        };
      });

      console.log(`Test cart created with ${testCartItems.length} ACTIVE products (target: 30) - no invalid EANs possible`);
      setCart(testCartItems);
      
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
    if (!store) {
      console.error('No store information available');
      toast({
        title: "Error",
        description: "Información de tienda no disponible",
        variant: "destructive",
      });
      return;
    }
    
    const orderId = await createPurchaseOrder(user?.email || '', store.code, cartItems);
    setLastOrderId(orderId);
    clearCart();
    setCartOpen(false);
    setLocation(`/order-confirmation/${orderId}`);
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
          user={user}
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
      updateCartItem={handleUpdateCartItem}
      removeFromCart={handleRemoveFromCart}
      addToCart={handleAddToCart}
      clearCart={handleClearCart}
      onCheckout={handleCheckout}
      onCreateTestCart={createTestCart}
      isCartPending={isPending}
    >
      <Switch>
        <Route path="/" component={() => (
          <ProductCatalog 
            onAddToCart={handleAddToCart} 
            onUpdateCart={handleUpdateCartItem}
            onRemoveFromCart={handleRemoveFromCart}
            getCartQuantity={(ean: string) => cartItems.find(item => item.ean === ean)?.quantity || 0}
          />
        )} />
        <Route path="/catalog" component={() => (
          <ProductCatalog 
            onAddToCart={handleAddToCart} 
            onUpdateCart={handleUpdateCartItem}
            onRemoveFromCart={handleRemoveFromCart}
            getCartQuantity={(ean: string) => cartItems.find(item => item.ean === ean)?.quantity || 0}
          />
        )} />
        <Route path="/products/:ean" component={() => (
          <ProductDetail 
            cartItems={cartItems}
            onAddToCart={handleAddToCart} 
            onUpdateCart={handleUpdateCartItem}
            onRemoveFromCart={handleRemoveFromCart}
            isCartPending={isPending}
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
        <CartProvider>
          <Toaster />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
