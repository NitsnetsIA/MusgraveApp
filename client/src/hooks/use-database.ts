import { useState, useEffect } from 'react';
import { DatabaseService as IndexedDBService } from '@/lib/indexeddb';
import { UnifiedDatabaseService } from '@/lib/database-service';
import { loginUserOnline } from '@/lib/sync-service';
import type { User, Product, PurchaseOrder, Order, CartItem } from '@shared/schema';

// Helper functions
function generateUUID(): string {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generatePurchaseOrderId(): string {
  const musgraveCenterCode = 'MUS';
  const timestamp = Date.now().toString().slice(-8);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${musgraveCenterCode}-${timestamp}-${suffix}`;
}

function generateProcessedOrderId(): string {
  const musgraveCenterCode = 'MUS';
  const timestamp = Date.now().toString().slice(-8);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${musgraveCenterCode}-${timestamp}-${suffix}`;
}

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    async function init() {
      try {
        // IndexedDB initialization is automatic, just set as initialized
        setIsInitialized(true);
        console.log('IndexedDB ready for use');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        setIsInitialized(true); // Allow app to start anyway
      }
    }

    init();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // User operations
  const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
      const user = await IndexedDBService.getUser(email);
      return user && user.is_active ? user : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  };

  const authenticateUser = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('Starting authentication process for:', email);
      
      // First, try online authentication against GraphQL server
      console.log('Attempting online authentication...');
      const onlineResult = await loginUserOnline(email, password);
      
      if (onlineResult.success && onlineResult.user) {
        console.log('Online authentication successful:', onlineResult.user);
        
        // Check if user exists locally, if not create/update it
        const localUser = await IndexedDBService.getUser(email);
        
        const userToSave = {
          email: onlineResult.user.email,
          store_id: onlineResult.user.store_id,
          name: onlineResult.user.name,
          is_active: onlineResult.user.is_active ? 1 : 0,
          password_hash: 'online_verified', // Placeholder since we verified online
          created_at: (onlineResult.user as any).created_at || new Date().toISOString(),
          updated_at: (onlineResult.user as any).updated_at || new Date().toISOString(),
          last_login: (onlineResult.user as any).last_login || new Date().toISOString()
        };
        
        if (!localUser) {
          // Create new local user from online data
          console.log('Creating new local user from online data');
          await IndexedDBService.addUser(userToSave);
        } else {
          // Update existing local user with online data
          console.log('Updating existing local user with online data');
          await IndexedDBService.addUser(userToSave); // addUser acts as upsert
        }
        
        // Return the updated user data
        return userToSave;
      }
      
      console.log('Online authentication failed, falling back to local authentication');
      
      // Fallback to local authentication if online fails
      const user = await IndexedDBService.getUser(email);
      
      if (!user || !user.is_active) {
        console.log('User not found locally or inactive');
        return null;
      }
      
      // Import password verification function
      const { verifyPassword } = await import('../lib/auth');
      
      // Verify password using SHA3 with email salt
      const isValidPassword = verifyPassword(password, email, user.password_hash);
      
      if (isValidPassword) {
        console.log('Local authentication successful');
        return user;
      }
      
      console.log('Local authentication failed - invalid password');
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  };

  // Product operations - use unified database service
  const getProducts = async (searchTerm: string = ''): Promise<Product[]> => {
    const { UnifiedDatabaseService } = await import('@/lib/database-service');
    return await UnifiedDatabaseService.getProducts(searchTerm);
  };

  const getProductByEan = async (ean: string): Promise<Product | null> => {
    const { UnifiedDatabaseService } = await import('@/lib/database-service');
    return await UnifiedDatabaseService.getProductByEan(ean);
  };

  // Store operations - use IndexedDB directly for user store data
  const getStoreByCode = async (code: string) => {
    try {
      console.log('DatabaseService.getStoreByCode called for:', code);
      
      // Use IndexedDB service directly to get store with delivery center info
      const user = await IndexedDBService.getUser('luis@esgranvia.es'); // Use hardcoded user for now
      if (!user) {
        console.log('User not found, cannot get store');
        return null;
      }
      
      const storeWithDeliveryCenter = await IndexedDBService.getUserStore(user.email);
      console.log('Store data loaded after sync:', storeWithDeliveryCenter);
      return storeWithDeliveryCenter;
    } catch (error) {
      console.error('Error getting store from IndexedDB:', error);
      return null;
    }
  };

  // Purchase order operations - use unified database service
  const getPurchaseOrders = async (userEmail: string): Promise<PurchaseOrder[]> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      const orders = await UnifiedDatabaseService.getPurchaseOrdersForUser(userEmail);
      console.log('Purchase orders found:', orders.length, 'for user:', userEmail);
      return orders;
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return [];
    }
  };

  const getPurchaseOrderById = async (id: string): Promise<any> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      
      // Get all purchase orders first - pass empty string to get all orders
      const allOrders = await UnifiedDatabaseService.getPurchaseOrdersForUser('');
      const order = allOrders.find(o => o.purchase_order_id === id);
      if (!order) {
        console.log('Order not found with ID:', id, 'Available orders:', allOrders.length);
        return null;
      }

      // Get items 
      const items = await UnifiedDatabaseService.getPurchaseOrderItems(id);
      
      // For items without snapshot data (legacy), fallback to current product data
      const enhancedItems = await Promise.all(items.map(async item => {
        if (!item.item_title) {
          // Fallback to current product data for legacy items
          const product = await UnifiedDatabaseService.getProductByEan(item.item_ean);
          if (product) {
            return {
              ...item,
              item_title: product.title,
              item_description: product.description,
              unit_of_measure: product.unit_of_measure,
              quantity_measure: product.quantity_measure,
              image_url: product.image_url,
              title: product.title, // For backward compatibility
            };
          }
        }
        return {
          ...item,
          title: item.item_title, // For backward compatibility
        };
      }));

      return { ...order, items: enhancedItems };
    } catch (error) {
      console.error('Error getting purchase order:', error);
      return null;
    }
  };

  // Orders operations - use unified database service
  const getOrders = async (userEmail: string): Promise<any[]> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      const orders = await UnifiedDatabaseService.getOrdersForUser(userEmail);
      console.log('Orders found:', orders.length, 'for user:', userEmail);
      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  };

  const getOrderById = async (id: string): Promise<any> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      
      // Get all orders - pass empty string to get all orders
      const allOrders = await UnifiedDatabaseService.getOrdersForUser('');
      const order = allOrders.find(o => o.order_id === id);
      if (!order) {
        console.log('Order not found with ID:', id, 'Available orders:', allOrders.length);
        return null;
      }

      // Get items 
      const items = await UnifiedDatabaseService.getOrderItems(id);
      
      return { ...order, items };
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  };

  const createPurchaseOrder = async (userEmail: string, storeId: string, cartItems: CartItem[]): Promise<string> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      const purchaseOrderId = generatePurchaseOrderId();
      const now = new Date().toISOString();

      let subtotal = 0;
      let taxTotal = 0;

      // Calculate totals
      for (const item of cartItems) {
        const itemSubtotal = item.base_price * item.quantity;
        const itemTax = itemSubtotal * item.tax_rate;
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }

      const finalTotal = subtotal + taxTotal;

      // Simulate workflow - 90% completed for easier testing
      const random = Math.random();
      const randomStatus = random < 0.9 ? 'completed' : (random < 0.95 ? 'processing' : 'uncommunicated');

      // Create purchase order using unified service
      const purchaseOrder = {
        purchase_order_id: purchaseOrderId,
        user_email: userEmail,
        store_id: storeId,
        created_at: now,
        status: randomStatus,
        subtotal,
        tax_total: taxTotal,
        final_total: finalTotal,
        server_send_at: null // Initialize as not sent to server
      };
      
      await UnifiedDatabaseService.createPurchaseOrder(purchaseOrder);

      // Add purchase order items using unified service
      const purchaseOrderItems = [];
      for (const item of cartItems) {
        const orderItem = {
          purchase_order_id: purchaseOrderId,
          item_ean: item.ean,
          item_title: item.title,
          item_description: (item as any).description || 'Producto',
          unit_of_measure: (item as any).unit_of_measure || 'unidad',
          quantity_measure: (item as any).quantity_measure || 1,
          image_url: item.image_url || '',
          quantity: item.quantity,
          base_price_at_order: item.base_price,
          tax_rate_at_order: item.tax_rate
        };
        purchaseOrderItems.push(orderItem);
        await UnifiedDatabaseService.addPurchaseOrderItem(orderItem);
      }

      // Try to send to GraphQL server
      try {
        const { sendPurchaseOrderToServer } = await import('../lib/purchase-order-sync');
        const success = await sendPurchaseOrderToServer(purchaseOrder, purchaseOrderItems);
        
        if (success) {
          // Update server_send_at timestamp using IndexedDB
          const { DatabaseService } = await import('../lib/indexeddb');
          await DatabaseService.updatePurchaseOrderSendStatus(purchaseOrderId, new Date().toISOString());
          console.log(`✅ Purchase order ${purchaseOrderId} sent to server successfully`);
        } else {
          console.log(`💾 Purchase order ${purchaseOrderId} saved locally - server sync will retry during next sync`);
        }
      } catch (serverError) {
        console.error(`Failed to send purchase order ${purchaseOrderId} to server:`, serverError);
      }

      // If status is "completed", create a corresponding processed order
      if (randomStatus === 'completed') {
        await createProcessedOrder(purchaseOrderId, userEmail, storeId, cartItems, subtotal, taxTotal, finalTotal);
      }

      return purchaseOrderId;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  };

  // Create processed order when purchase order is completed
  const createProcessedOrder = async (
    purchaseOrderId: string, 
    userEmail: string, 
    storeId: string, 
    cartItems: CartItem[], 
    subtotal: number, 
    taxTotal: number, 
    finalTotal: number
  ): Promise<string> => {
    try {
      // Use Musgrave center code for processed order ID (122 for Dolores Alicante)
      const orderId = generateProcessedOrderId();
      const now = new Date().toISOString();

      // Simulate modifications for processed order
      const { modifiedItems, hasModifications, newSubtotal, newTaxTotal, newFinalTotal } = simulateOrderModifications(cartItems);

      // Create observations if there are modifications
      const observations = hasModifications ? 
        "Se han producido cambios sobre su orden de compra. Si tiene cualquier problema póngase en contacto con Musgrave" : 
        null;

      // Create processed order using unified service
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      await UnifiedDatabaseService.createOrder({
        order_id: orderId,
        source_purchase_order_id: purchaseOrderId,
        user_email: userEmail,
        store_id: storeId,
        created_at: now,
        observations: observations,
        subtotal: newSubtotal,
        tax_total: newTaxTotal,
        final_total: newFinalTotal,
        status: 'completed'
      });

      // Add order items using unified service
      for (const item of modifiedItems) {
        await UnifiedDatabaseService.addOrderItem({
          order_id: orderId,
          item_ean: item.ean,
          item_title: item.title,
          item_description: (item as any).description || 'Producto',
          unit_of_measure: (item as any).unit_of_measure || 'unidad',
          quantity_measure: (item as any).quantity_measure || 1,
          image_url: item.image_url || '',
          quantity: item.quantity,
          base_price_at_order: item.base_price,
          tax_rate_at_order: item.tax_rate
        });
      }

      console.log(`Created processed order ${orderId} for completed purchase order ${purchaseOrderId}${hasModifications ? ' with modifications' : ''}`);
      return orderId;
    } catch (error) {
      console.error('Error creating processed order:', error);
      throw error;
    }
  };

  // Simulate modifications for processed orders - ULTRA OPTIMIZED
  const simulateOrderModifications = (originalItems: CartItem[]) => {
    // Quick simulation without database queries for maximum speed
    let modifiedItems: CartItem[] = [];
    let hasModifications = false;
    
    for (const item of originalItems) {
      let modifiedItem = { ...item };
      
      // 10% chance of quantity modification per item
      if (Math.random() < 0.1) {
        hasModifications = true;
        const modType = Math.random();
        
        if (modType < 0.3) {
          // 30% chance: Delete item completely (skip it)
          continue;
        } else if (modType < 0.8) {
          // 50% chance: Decrease quantity (10-30% reduction)
          const reductionFactor = 0.1 + Math.random() * 0.2; // 10-30% reduction
          const newQuantity = Math.max(1, Math.floor(item.quantity * (1 - reductionFactor)));
          modifiedItem.quantity = newQuantity;
        } else {
          // 20% chance: Increase quantity (10-20% increase)
          const increaseFactor = 0.1 + Math.random() * 0.1; // 10-20% increase
          const newQuantity = Math.ceil(item.quantity * (1 + increaseFactor));
          modifiedItem.quantity = newQuantity;
        }
      }
      
      // 5% chance of price modification per item (reduced probability)
      if (Math.random() < 0.05) {
        hasModifications = true;
        // Random ±10% price change
        const priceChangeFactor = Math.random() < 0.5 ? 0.95 : 1.05; // -5% or +5%
        modifiedItem.base_price = Number((item.base_price * priceChangeFactor).toFixed(2));
      }
      
      // Add item to modified list
      modifiedItems.push(modifiedItem);
    }
    
    // Calculate new totals
    let newSubtotal = 0;
    let newTaxTotal = 0;
    
    for (const item of modifiedItems) {
      const itemSubtotal = item.quantity * item.base_price;
      const itemTax = itemSubtotal * item.tax_rate;
      newSubtotal += itemSubtotal;
      newTaxTotal += itemTax;
    }
    
    const newFinalTotal = newSubtotal + newTaxTotal;
    
    return {
      modifiedItems,
      hasModifications,
      newSubtotal,
      newTaxTotal,
      newFinalTotal
    };
  };



  // Get tax rate by code - use unified database service
  const getTaxRate = async (taxCode: string): Promise<number> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      return await UnifiedDatabaseService.getTaxRate(taxCode);
    } catch (error) {
      console.error('Error getting tax rate:', error);
      return 0.21;
    }
  };

  return {
    isInitialized,
    isOffline,
    getUserByEmail,
    authenticateUser,
    getProducts,
    getProductByEan,
    getStoreByCode,
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    createProcessedOrder,
    getOrders,
    getOrderById,
    getTaxRate,

  };
}
