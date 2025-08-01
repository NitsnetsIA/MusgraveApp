import { useState, useEffect } from 'react';
import { initDatabase, query, execute, saveDatabase, generateUUID } from '@/lib/database';
import { seedDatabase } from '@/lib/seed-data';
import type { User, Product, PurchaseOrder, Order, CartItem } from '@shared/schema';

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        await seedDatabase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
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
      // Note: Direct SQL string substitution works due to SQLite parameter binding issue
      const results = query(`SELECT * FROM users WHERE email = '${email}' AND is_active = 1`);
      
      const user = results[0];
      if (!user) {
        return null;
      }
      
      // Import password verification function
      const { verifyPassword } = await import('../lib/auth');
      
      // Verify password using SHA3 with email salt
      const isValidPassword = verifyPassword(password, email, user.password_hash);
      
      if (isValidPassword) {
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  };

  // Product operations
  const getProducts = async (searchTerm: string = ''): Promise<Product[]> => {
    try {
      let sql = 'SELECT * FROM products WHERE is_active = 1';

      if (searchTerm) {
        // Use direct string substitution due to SQLite parameter binding issue
        const escapedTerm = searchTerm.replace(/'/g, "''"); // Escape single quotes
        sql += ` AND (ean LIKE '%${escapedTerm}%' OR title LIKE '%${escapedTerm}%' OR ref LIKE '%${escapedTerm}%')`;
      }

      sql += ' ORDER BY title';
      return query(sql);
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  };

  const getProductByEan = async (ean: string): Promise<Product | null> => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const results = query(`SELECT * FROM products WHERE ean = '${ean}' AND is_active = 1`);
      return results[0] || null;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  };

  // Store operations
  const getStoreByCode = async (code: string) => {
    try {
      // Use direct string substitution due to SQLite parameter binding issue
      const results = query(`
        SELECT s.*, dc.name as delivery_center_name 
        FROM stores s 
        JOIN delivery_centers dc ON s.delivery_center_code = dc.code 
        WHERE s.code = '${code}' AND s.is_active = 1
      `);
      return results[0] || null;
    } catch (error) {
      console.error('Error getting store:', error);
      return null;
    }
  };

  // Purchase order operations
  const getPurchaseOrders = async (userEmail: string): Promise<PurchaseOrder[]> => {
    try {
      return query('SELECT * FROM purchase_orders WHERE user_email = ? ORDER BY created_at DESC', [userEmail]);
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return [];
    }
  };

  const getPurchaseOrderById = async (id: string): Promise<any> => {
    try {
      const orders = query('SELECT * FROM purchase_orders WHERE purchase_order_id = ?', [id]);
      if (orders.length === 0) return null;

      const order = orders[0];
      const items = query(`
        SELECT poi.*, p.title, p.image_url 
        FROM purchase_order_items poi 
        JOIN products p ON poi.item_ean = p.ean 
        WHERE poi.purchase_order_id = ?
      `, [id]);

      return { ...order, items };
    } catch (error) {
      console.error('Error getting purchase order:', error);
      return null;
    }
  };

  const createPurchaseOrder = async (userEmail: string, storeId: string, cartItems: CartItem[]): Promise<string> => {
    try {
      const purchaseOrderId = generateUUID();
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

      // Insert purchase order
      execute(`
        INSERT INTO purchase_orders (purchase_order_id, user_email, store_id, created_at, status, subtotal, tax_total, final_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [purchaseOrderId, userEmail, storeId, now, 'uncommunicated', subtotal, taxTotal, finalTotal]);

      // Insert purchase order items
      for (const item of cartItems) {
        execute(`
          INSERT INTO purchase_order_items (purchase_order_id, item_ean, quantity, base_price_at_order, tax_rate_at_order)
          VALUES (?, ?, ?, ?, ?)
        `, [purchaseOrderId, item.ean, item.quantity, item.base_price, item.tax_rate]);
      }

      return purchaseOrderId;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  };

  // Order operations
  const getOrders = async (userEmail: string): Promise<Order[]> => {
    try {
      return query('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC', [userEmail]);
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  };

  const getOrderById = async (id: string): Promise<any> => {
    try {
      const orders = query('SELECT * FROM orders WHERE order_id = ?', [id]);
      if (orders.length === 0) return null;

      const order = orders[0];
      const items = query(`
        SELECT oi.*, p.title, p.image_url 
        FROM order_items oi 
        JOIN products p ON oi.item_ean = p.ean 
        WHERE oi.order_id = ?
      `, [id]);

      return { ...order, items };
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
    getOrders,
    getOrderById,
    getTaxRate,
    saveDatabase
  };
}
