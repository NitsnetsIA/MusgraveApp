import { useState, useEffect } from 'react';
import { DatabaseService } from '../lib/indexeddb';
import type { User, Store, Product, Tax, PurchaseOrder, PurchaseOrderItem, Order, OrderItem } from '../lib/indexeddb';

// Database initialization hook
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initDB() {
      try {
        await DatabaseService.initialize();
        if (mounted) {
          setIsInitialized(true);
          console.log('IndexedDB initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize database');
        }
      }
    }

    initDB();

    return () => {
      mounted = false;
    };
  }, []);

  const clearDatabase = async () => {
    try {
      await DatabaseService.clearDatabase();
      console.log('Database cleared successfully');
    } catch (err) {
      console.error('Failed to clear database:', err);
      throw err;
    }
  };

  return {
    isInitialized,
    error,
    clearDatabase
  };
}

// User authentication hook
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStore, setUserStore] = useState<(Store & { delivery_center_name?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await DatabaseService.getUser(email);
      if (!user || user.password_hash !== password) {
        throw new Error('Invalid credentials');
      }

      setCurrentUser(user);
      
      // Load user's store data
      const store = await DatabaseService.getUserStore(email);
      setUserStore(store);
      
      console.log('User logged in:', user);
      console.log('Store data loaded after sync:', store);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserStore(null);
  };

  return {
    currentUser,
    userStore,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
}

// Products hook
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async (activeOnly: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedProducts = await DatabaseService.getProducts(activeOnly);
      setProducts(loadedProducts);
      
      const total = loadedProducts.length;
      const active = loadedProducts.filter(p => p.is_active === 1).length;
      const inactive = total - active;
      
      console.log(`Product counts: Total=${total}, Active=${active}, Inactive=${inactive}`);
      console.log(`ProductCatalog: Loaded ${active} products (${activeOnly ? 'active only' : 'all products'})`);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await DatabaseService.searchProducts(query);
      setProducts(results);
      console.log(`Search results: ${results.length} products found for "${query}"`);
    } catch (err) {
      console.error('Failed to search products:', err);
      setError(err instanceof Error ? err.message : 'Failed to search products');
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = async (ean: string): Promise<Product | undefined> => {
    try {
      return await DatabaseService.getProduct(ean);
    } catch (err) {
      console.error('Failed to get product:', err);
      return undefined;
    }
  };

  const getTax = async (taxCode: string): Promise<Tax | undefined> => {
    try {
      return await DatabaseService.getTax(taxCode);
    } catch (err) {
      console.error('Failed to get tax:', err);
      return undefined;
    }
  };

  return {
    products,
    isLoading,
    error,
    loadProducts,
    searchProducts,
    getProduct,
    getTax
  };
}

// Purchase orders hook
export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPurchaseOrders = async (userEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const orders = await DatabaseService.getPurchaseOrders(userEmail);
      setPurchaseOrders(orders);
      console.log(`Loaded ${orders.length} purchase orders for ${userEmail}`);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  const savePurchaseOrder = async (order: PurchaseOrder, items: PurchaseOrderItem[]) => {
    try {
      await DatabaseService.savePurchaseOrder(order, items);
      console.log(`Saved purchase order: ${order.purchase_order_id} with ${items.length} items`);
    } catch (err) {
      console.error('Failed to save purchase order:', err);
      throw err;
    }
  };

  const getPurchaseOrder = async (orderId: string): Promise<PurchaseOrder | undefined> => {
    try {
      return await DatabaseService.getPurchaseOrder(orderId);
    } catch (err) {
      console.error('Failed to get purchase order:', err);
      return undefined;
    }
  };

  const getPurchaseOrderItems = async (orderId: string): Promise<PurchaseOrderItem[]> => {
    try {
      return await DatabaseService.getPurchaseOrderItems(orderId);
    } catch (err) {
      console.error('Failed to get purchase order items:', err);
      return [];
    }
  };

  return {
    purchaseOrders,
    isLoading,
    error,
    loadPurchaseOrders,
    savePurchaseOrder,
    getPurchaseOrder,
    getPurchaseOrderItems
  };
}

// Orders hook  
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (userEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedOrders = await DatabaseService.getOrders(userEmail);
      setOrders(loadedOrders);
      console.log(`Loaded ${loadedOrders.length} orders for ${userEmail}`);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrder = async (orderId: string): Promise<Order | undefined> => {
    try {
      return await DatabaseService.getOrder(orderId);
    } catch (err) {
      console.error('Failed to get order:', err);
      return undefined;
    }
  };

  const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    try {
      return await DatabaseService.getOrderItems(orderId);
    } catch (err) {
      console.error('Failed to get order items:', err);
      return [];
    }
  };

  return {
    orders,
    isLoading,
    error,
    loadOrders,
    getOrder,
    getOrderItems
  };
}

// Database statistics hook
export function useDatabaseStats() {
  const [stats, setStats] = useState<{
    taxes: number;
    delivery_centers: number;
    stores: number;
    users: number;
    products: number;
    active_products: number;
    purchase_orders: number;
    orders: number;
  } | null>(null);

  const loadStats = async () => {
    try {
      const dbStats = await DatabaseService.getDatabaseStats();
      setStats(dbStats);
      return dbStats;
    } catch (err) {
      console.error('Failed to load database stats:', err);
      return null;
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    loadStats
  };
}