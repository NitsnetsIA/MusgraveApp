import { useState, useEffect } from 'react';
import { initDatabase, query, execute, saveDatabase, generateUUID, generatePurchaseOrderId, generateProcessedOrderId } from '@/lib/database';

import { loginUserOnline } from '@/lib/sync-service';
import type { User, Product, PurchaseOrder, Order, CartItem } from '@shared/schema';

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Try to recover by clearing localStorage and reinitializing
        try {
          console.log('Attempting database recovery...');
          localStorage.removeItem('musgrave_database');
          await initDatabase();
          console.log('Database recovery successful - empty database ready for GraphQL sync');
          setIsInitialized(true);
        } catch (resetError) {
          console.error('Failed to recover database:', resetError);
          // Force initialization to allow sync to work
          try {
            await initDatabase();
            console.log('Basic database initialized - ready for GraphQL sync');
            setIsInitialized(true);
          } catch (finalError) {
            console.error('Complete database initialization failure:', finalError);
            setIsInitialized(true); // Allow app to start anyway
          }
        }
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
      const results = query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
      return results[0] || null;
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
        const localResults = query(`SELECT * FROM users WHERE email = '${email}'`);
        const localUser = localResults[0];
        
        if (!localUser) {
          // Create new local user from online data
          console.log('Creating new local user from online data');
          execute(`
            INSERT INTO users (email, store_id, name, is_active, password_hash)
            VALUES (?, ?, ?, ?, ?)
          `, [
            onlineResult.user.email,
            onlineResult.user.store_id,
            onlineResult.user.name,
            onlineResult.user.is_active ? 1 : 0,
            'online_verified' // Placeholder since we verified online
          ]);
        } else {
          // Update existing local user with online data
          console.log('Updating existing local user with online data');
          execute(`
            UPDATE users 
            SET store_id = ?, name = ?, is_active = ?
            WHERE email = ?
          `, [
            onlineResult.user.store_id,
            onlineResult.user.name,
            onlineResult.user.is_active ? 1 : 0,
            onlineResult.user.email
          ]);
        }
        
        // Return the updated user data
        const updatedResults = query(`SELECT * FROM users WHERE email = '${email}' AND is_active = 1`);
        return updatedResults[0] || null;
      }
      
      console.log('Online authentication failed, falling back to local authentication');
      
      // Fallback to local authentication if online fails
      const results = query(`SELECT * FROM users WHERE email = '${email}' AND is_active = 1`);
      
      const user = results[0];
      if (!user) {
        console.log('User not found locally');
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

  // Store operations - use unified database service
  const getStoreByCode = async (code: string) => {
    const { UnifiedDatabaseService } = await import('@/lib/database-service');
    return await UnifiedDatabaseService.getStoreByCode(code);
  };

  // Purchase order operations
  const getPurchaseOrders = async (userEmail: string): Promise<PurchaseOrder[]> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const orders = query(`SELECT * FROM purchase_orders WHERE user_email = '${userEmail}' ORDER BY created_at DESC`);
      console.log('Purchase orders found:', orders.length, 'for user:', userEmail);
      return orders;
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return [];
    }
  };

  const getPurchaseOrderById = async (id: string): Promise<any> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const orders = query(`SELECT * FROM purchase_orders WHERE purchase_order_id = '${id}'`);
      if (orders.length === 0) return null;

      const order = orders[0];
      // Get items with product snapshot data (captured at order time)
      const items = query(`
        SELECT poi.* 
        FROM purchase_order_items poi 
        WHERE poi.purchase_order_id = '${id}'
      `);

      // For items without snapshot data (legacy), fallback to current product data
      const enhancedItems = items.map(item => {
        if (!item.item_title) {
          // Fallback to current product data for legacy items
          const productData = query(`SELECT * FROM products WHERE ean = '${item.item_ean}'`);
          const product = productData[0];
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
      });

      return { ...order, items: enhancedItems };
    } catch (error) {
      console.error('Error getting purchase order:', error);
      return null;
    }
  };

  const createPurchaseOrder = async (userEmail: string, storeId: string, cartItems: CartItem[]): Promise<string> => {
    try {
      const { UnifiedDatabaseService } = await import('@/lib/database-service');
      const purchaseOrderId = generatePurchaseOrderId(storeId);
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
      await UnifiedDatabaseService.createPurchaseOrder({
        purchase_order_id: purchaseOrderId,
        user_email: userEmail,
        store_id: storeId,
        created_at: now,
        status: randomStatus,
        subtotal,
        tax_total: taxTotal,
        final_total: finalTotal
      });

      // Add purchase order items using unified service
      for (const item of cartItems) {
        await UnifiedDatabaseService.addPurchaseOrderItem({
          purchase_order_id: purchaseOrderId,
          item_ean: item.ean,
          item_title: item.title,
          item_description: item.description || 'Producto',
          unit_of_measure: item.unit_of_measure || 'unidad',
          quantity_measure: item.quantity_measure || 1,
          image_url: item.image_url || '',
          quantity: item.quantity,
          base_price_at_order: item.base_price,
          tax_rate_at_order: item.tax_rate
        });
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
      const orderId = generateProcessedOrderId('122');
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
          item_description: item.description || 'Producto',
          unit_of_measure: item.unit_of_measure || 'unidad',
          quantity_measure: item.quantity_measure || 1,
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

  // Order operations
  const getOrders = async (userEmail: string): Promise<Order[]> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      return query(`SELECT * FROM orders WHERE user_email = '${userEmail}' ORDER BY created_at DESC`);
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  };

  const getOrderById = async (id: string): Promise<any> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const orders = query(`SELECT * FROM orders WHERE order_id = '${id}'`);
      if (orders.length === 0) return null;

      const order = orders[0];
      // Get items with product snapshot data (captured at order time)
      const items = query(`
        SELECT oi.* 
        FROM order_items oi 
        WHERE oi.order_id = '${id}'
      `);

      // For items without snapshot data (legacy), fallback to current product data
      const enhancedItems = items.map(item => {
        if (!item.item_title) {
          // Fallback to current product data for legacy items
          const productData = query(`SELECT * FROM products WHERE ean = '${item.item_ean}'`);
          const product = productData[0];
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
      });

      return { ...order, items: enhancedItems };
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  };

  // Get tax rate by code
  const getTaxRate = async (taxCode: string): Promise<number> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const results = query(`SELECT tax_rate FROM taxes WHERE code = '${taxCode}'`);
      return results[0]?.tax_rate || 0.21;
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
    saveDatabase
  };
}
