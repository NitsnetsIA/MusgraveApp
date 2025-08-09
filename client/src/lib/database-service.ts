// Abstract database service that works with both SQL.js and IndexedDB
import { DatabaseService as IndexedDBService, db } from './indexeddb';
import { query } from './database';

export type StorageType = 'sql' | 'indexeddb';

let currentStorageType: StorageType = 'indexeddb'; // Default to IndexedDB

export function setStorageType(type: StorageType) {
  currentStorageType = type;
  console.log(`Database service switched to: ${type}`);
}

export function getCurrentStorageType(): StorageType {
  return currentStorageType;
}

// Unified interface for product operations
export class UnifiedDatabaseService {
  
  // Get all products with optional search
  static async getProducts(searchTerm?: string): Promise<any[]> {
    console.log(`UnifiedDatabaseService.getProducts called with searchTerm: "${searchTerm}", storage type: ${currentStorageType}`);
    
    if (currentStorageType === 'indexeddb') {
      try {
        let products;
        if (searchTerm) {
          products = await IndexedDBService.searchProducts(searchTerm);
          console.log(`IndexedDB search returned ${products.length} products for "${searchTerm}"`);
        } else {
          products = await IndexedDBService.getProducts(true); // active only
          console.log(`IndexedDB getProducts returned ${products.length} active products`);
        }
        return products;
      } catch (error) {
        console.error('Error getting products from IndexedDB:', error);
        return [];
      }
    } else {
      return await UnifiedDatabaseService.getProductsSQL(searchTerm);
    }
  }

  // Get product by EAN
  static async getProductByEan(ean: string): Promise<any | null> {
    console.log(`UnifiedDatabaseService.getProductByEan called for EAN: ${ean}, storage type: ${currentStorageType}`);
    
    if (currentStorageType === 'indexeddb') {
      try {
        const product = await IndexedDBService.getProduct(ean);
        console.log(`IndexedDB getProductByEan returned:`, product ? 'found' : 'not found');
        return product || null;
      } catch (error) {
        console.error('Error getting product by EAN from IndexedDB:', error);
        return null;
      }
    } else {
      return await UnifiedDatabaseService.getProductByEanSQL(ean);
    }
  }

  // Get tax rate by code
  static async getTaxRate(taxCode: string): Promise<number> {
    console.log(`UnifiedDatabaseService.getTaxRate called for code: ${taxCode}, storage type: ${currentStorageType}`);
    
    if (currentStorageType === 'indexeddb') {
      try {
        const tax = await IndexedDBService.getTax(taxCode);
        const rate = tax ? tax.tax_rate : 0.21; // Default IVA general
        console.log(`IndexedDB getTaxRate returned: ${rate} for code ${taxCode}`);
        return rate;
      } catch (error) {
        console.error('Error getting tax rate from IndexedDB:', error);
        return 0.21; // Default IVA general
      }
    } else {
      return await UnifiedDatabaseService.getTaxRateSQL(taxCode);
    }
  }

  // Get products count
  static async getProductCounts(): Promise<{ total: number; active: number; inactive: number }> {
    if (currentStorageType === 'indexeddb') {
      const allProducts = await db.products.toArray();
      const activeProducts = allProducts.filter(p => p.is_active === 1);
      console.log(`IndexedDB Product counts: Total=${allProducts.length}, Active=${activeProducts.length}, Inactive=${allProducts.length - activeProducts.length}`);
      return {
        total: allProducts.length,
        active: activeProducts.length,
        inactive: allProducts.length - activeProducts.length
      };
    } else {
      return UnifiedDatabaseService.getProductCountsSQL();
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<any | null> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getUser(email);
    } else {
      return UnifiedDatabaseService.getUserByEmailSQL(email);
    }
  }

  // Add user
  static async addUser(user: any): Promise<void> {
    if (currentStorageType === 'indexeddb') {
      await IndexedDBService.addUser(user);
    } else {
      UnifiedDatabaseService.addUserSQL(user);
    }
  }

  // Get store by code
  static async getStoreByCode(code: string): Promise<any | null> {
    if (currentStorageType === 'indexeddb') {
      // Use the imported db instance directly
      const store = await db.stores.where('code').equals(code).first();
      if (!store) return null;
      
      // Get delivery center name
      const deliveryCenter = await db.delivery_centers.where('code').equals(store.delivery_center_code).first();
      
      return {
        ...store,
        delivery_center_name: deliveryCenter?.name
      };
    } else {
      return UnifiedDatabaseService.getStoreByCodeSQL(code);
    }
  }

  // Create purchase order
  static async createPurchaseOrder(order: any): Promise<void> {
    if (currentStorageType === 'indexeddb') {
      await IndexedDBService.addPurchaseOrder(order);
    } else {
      UnifiedDatabaseService.createPurchaseOrderSQL(order);
    }
  }

  // Add purchase order item
  static async addPurchaseOrderItem(item: any): Promise<void> {
    if (currentStorageType === 'indexeddb') {
      await IndexedDBService.addPurchaseOrderItem(item);
    } else {
      UnifiedDatabaseService.addPurchaseOrderItemSQL(item);
    }
  }

  // Create order
  static async createOrder(order: any): Promise<void> {
    if (currentStorageType === 'indexeddb') {
      await IndexedDBService.addOrder(order);
    } else {
      UnifiedDatabaseService.createOrderSQL(order);
    }
  }

  // Add order item
  static async addOrderItem(item: any): Promise<void> {
    if (currentStorageType === 'indexeddb') {
      await IndexedDBService.addOrderItem(item);
    } else {
      UnifiedDatabaseService.addOrderItemSQL(item);
    }
  }

  // Get orders for user
  static async getOrdersForUser(userEmail: string): Promise<any[]> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getOrders(userEmail);
    } else {
      return UnifiedDatabaseService.getOrdersForUserSQL(userEmail);
    }
  }

  // Get order items
  static async getOrderItems(orderId: string): Promise<any[]> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getOrderItems(orderId);
    } else {
      return UnifiedDatabaseService.getOrderItemsSQL(orderId);
    }
  }

  // Get purchase orders for user
  static async getPurchaseOrdersForUser(userEmail: string): Promise<any[]> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getPurchaseOrdersForUser(userEmail);
    } else {
      return UnifiedDatabaseService.getPurchaseOrdersForUserSQL(userEmail);
    }
  }

  // Get purchase order items
  static async getPurchaseOrderItems(purchaseOrderId: string): Promise<any[]> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getPurchaseOrderItems(purchaseOrderId);
    } else {
      return UnifiedDatabaseService.getPurchaseOrderItemsSQL(purchaseOrderId);
    }
  }

  // Get tax by code
  static async getTaxByCode(code: string): Promise<any | null> {
    if (currentStorageType === 'indexeddb') {
      return await IndexedDBService.getTax(code);
    } else {
      return UnifiedDatabaseService.getTaxByCodeSQL(code);
    }
  }

  // SQL.js implementations
  private static async getProductsSQL(searchTerm?: string): Promise<any[]> {
    try {
      let sql = `
        SELECT p.ean, p.ref, p.title, p.description, p.base_price, 
               p.tax_code, p.unit_of_measure, p.quantity_measure, 
               p.image_url, p.is_active, t.tax_rate
        FROM products p
        LEFT JOIN taxes t ON p.tax_code = t.code
        WHERE p.is_active = 1
      `;
      
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        sql += ` AND (
          LOWER(p.title) LIKE '%${term}%' OR 
          LOWER(p.description) LIKE '%${term}%' OR 
          p.ean LIKE '%${term}%' OR 
          p.ref LIKE '%${term}%'
        )`;
      }
      
      sql += ' ORDER BY p.title';
      
      const results = query(sql);
      return results || [];
    } catch (error) {
      console.error('Error getting products from SQL:', error);
      return [];
    }
  }

  private static getProductByEanSQL(ean: string): any | null {
    try {
      const results = query(`
        SELECT p.ean, p.ref, p.title, p.description, p.base_price, 
               p.tax_code, p.unit_of_measure, p.quantity_measure, 
               p.image_url, p.is_active, t.tax_rate
        FROM products p
        LEFT JOIN taxes t ON p.tax_code = t.code
        WHERE p.ean = '${ean}'
      `);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting product by EAN from SQL:', error);
      return null;
    }
  }

  private static getProductCountsSQL(): { total: number; active: number; inactive: number } {
    try {
      const totalResult = query('SELECT COUNT(*) as count FROM products');
      const activeResult = query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
      const inactiveResult = query('SELECT COUNT(*) as count FROM products WHERE is_active = 0');
      
      const total = totalResult.length > 0 ? totalResult[0].count : 0;
      const active = activeResult.length > 0 ? activeResult[0].count : 0;
      const inactive = inactiveResult.length > 0 ? inactiveResult[0].count : 0;
      
      console.log(`Product counts: Total=${total}, Active=${active}, Inactive=${inactive}`);
      return { total, active, inactive };
    } catch (error) {
      console.error('Error getting product counts from SQL:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  private static getUserByEmailSQL(email: string): any | null {
    try {
      const results = query(`SELECT * FROM users WHERE email = '${email}'`);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting user by email from SQL:', error);
      return null;
    }
  }

  private static addUserSQL(user: any): void {
    try {
      query(`
        INSERT OR REPLACE INTO users (email, store_id, name, password_hash, is_active)
        VALUES ('${user.email}', '${user.store_id}', '${user.name}', '${user.password_hash}', ${user.is_active})
      `);
    } catch (error) {
      console.error('Error adding user to SQL:', error);
    }
  }

  private static getStoreByCodeSQL(code: string): any | null {
    try {
      const results = query(`
        SELECT s.*, dc.name as delivery_center_name 
        FROM stores s
        LEFT JOIN delivery_centers dc ON s.delivery_center_code = dc.code
        WHERE s.code = '${code}'
      `);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting store by code from SQL:', error);
      return null;
    }
  }

  private static createPurchaseOrderSQL(order: any): void {
    try {
      query(`
        INSERT INTO purchase_orders (
          purchase_order_id, user_email, store_id, created_at, 
          status, subtotal, tax_total, final_total
        ) VALUES (
          '${order.purchase_order_id}', '${order.user_email}', '${order.store_id}', 
          '${order.created_at}', '${order.status}', ${order.subtotal}, 
          ${order.tax_total}, ${order.final_total}
        )
      `);
    } catch (error) {
      console.error('Error creating purchase order in SQL:', error);
    }
  }

  private static addPurchaseOrderItemSQL(item: any): void {
    try {
      query(`
        INSERT INTO purchase_order_items (
          purchase_order_id, item_ean, item_title, item_description,
          unit_of_measure, quantity_measure, image_url, quantity,
          base_price_at_order, tax_rate_at_order
        ) VALUES (
          '${item.purchase_order_id}', '${item.item_ean}', '${item.item_title}', 
          '${item.item_description}', '${item.unit_of_measure}', ${item.quantity_measure},
          '${item.image_url}', ${item.quantity}, ${item.base_price_at_order}, 
          ${item.tax_rate_at_order}
        )
      `);
    } catch (error) {
      console.error('Error adding purchase order item to SQL:', error);
    }
  }

  private static getPurchaseOrdersForUserSQL(userEmail: string): any[] {
    try {
      const results = query(`
        SELECT * FROM purchase_orders 
        WHERE user_email = '${userEmail}' 
        ORDER BY created_at DESC
      `);
      return results || [];
    } catch (error) {
      console.error('Error getting purchase orders from SQL:', error);
      return [];
    }
  }

  private static getPurchaseOrderItemsSQL(purchaseOrderId: string): any[] {
    try {
      const results = query(`
        SELECT * FROM purchase_order_items 
        WHERE purchase_order_id = '${purchaseOrderId}'
      `);
      return results || [];
    } catch (error) {
      console.error('Error getting purchase order items from SQL:', error);
      return [];
    }
  }

  private static getTaxByCodeSQL(code: string): any | null {
    try {
      const results = query(`SELECT * FROM taxes WHERE code = '${code}'`);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting tax by code from SQL:', error);
      return null;
    }
  }

  // SQL.js fallback methods for backward compatibility
  static async getProductsSQL(searchTerm?: string): Promise<any[]> {
    if (searchTerm) {
      const results = query(`
        SELECT * FROM products 
        WHERE is_active = 1 
        AND (
          title LIKE '%${searchTerm}%' 
          OR ean LIKE '%${searchTerm}%'
          OR ref LIKE '%${searchTerm}%'
        )
        ORDER BY title
      `);
      return results || [];
    } else {
      const results = query('SELECT * FROM products WHERE is_active = 1 ORDER BY title');
      return results || [];
    }
  }

  static async getProductByEanSQL(ean: string): Promise<any | null> {
    const results = query('SELECT * FROM products WHERE ean = ? AND is_active = 1', [ean]);
    return results.length > 0 ? results[0] : null;
  }

  static async getTaxRateSQL(taxCode: string): Promise<number> {
    const results = query('SELECT tax_rate FROM taxes WHERE code = ?', [taxCode]);
    return results.length > 0 ? results[0].tax_rate : 0.21; // Default IVA general
  }

  static async getProductCountsSQL(): Promise<{ total: number; active: number; inactive: number }> {
    const total = query('SELECT COUNT(*) as count FROM products')[0]?.count || 0;
    const active = query('SELECT COUNT(*) as count FROM products WHERE is_active = 1')[0]?.count || 0;
    return {
      total,
      active,
      inactive: total - active
    };
  }

  static async getUserByEmailSQL(email: string): Promise<any | null> {
    const results = query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    return results.length > 0 ? results[0] : null;
  }

  static addUserSQL(user: any): void {
    query('INSERT OR REPLACE INTO users (email, store_id, name, password_hash, is_active) VALUES (?, ?, ?, ?, ?)', 
      [user.email, user.store_id, user.name, user.password_hash, user.is_active]);
  }

  static async getStoreByCodeSQL(code: string): Promise<any | null> {
    const results = query(`
      SELECT s.*, dc.name as delivery_center_name 
      FROM stores s 
      LEFT JOIN delivery_centers dc ON s.delivery_center_code = dc.code 
      WHERE s.code = ?
    `, [code]);
    return results.length > 0 ? results[0] : null;
  }

  static createPurchaseOrderSQL(order: any): void {
    query(`INSERT INTO purchase_orders 
      (purchase_order_id, user_email, store_id, created_at, status, subtotal, tax_total, final_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [order.purchase_order_id, order.user_email, order.store_id, order.created_at, order.status, 
       order.subtotal, order.tax_total, order.final_total]);
  }

  static addPurchaseOrderItemSQL(item: any): void {
    query(`INSERT INTO purchase_order_items 
      (purchase_order_id, item_ean, item_title, item_description, unit_of_measure, quantity_measure, 
       image_url, quantity, base_price_at_order, tax_rate_at_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [item.purchase_order_id, item.item_ean, item.item_title, item.item_description, item.unit_of_measure, 
       item.quantity_measure, item.image_url, item.quantity, item.base_price_at_order, item.tax_rate_at_order]);
  }

  static async getPurchaseOrdersForUserSQL(userEmail: string): Promise<any[]> {
    return query('SELECT * FROM purchase_orders WHERE user_email = ? ORDER BY created_at DESC', [userEmail]);
  }

  static async getPurchaseOrderItemsSQL(purchaseOrderId: string): Promise<any[]> {
    return query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [purchaseOrderId]);
  }

  static createOrderSQL(order: any): void {
    query(`INSERT INTO orders 
      (order_id, user_email, store_id, created_at, status, subtotal, tax_total, final_total, observations) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [order.order_id, order.user_email, order.store_id, order.created_at, order.status, 
       order.subtotal, order.tax_total, order.final_total, order.observations]);
  }

  static addOrderItemSQL(item: any): void {
    query(`INSERT INTO order_items 
      (order_id, item_ean, item_title, item_description, unit_of_measure, quantity_measure, 
       image_url, quantity, base_price_at_order, tax_rate_at_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [item.order_id, item.item_ean, item.item_title, item.item_description, item.unit_of_measure, 
       item.quantity_measure, item.image_url, item.quantity, item.base_price_at_order, item.tax_rate_at_order]);
  }

  static async getOrdersForUserSQL(userEmail: string): Promise<any[]> {
    return query('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC', [userEmail]);
  }

  static async getOrderItemsSQL(orderId: string): Promise<any[]> {
    return query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  }
}