import Dexie, { type Table } from 'dexie';

// Database schema types
export interface Tax {
  code: string;
  name: string;
  tax_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryCenter {
  code: string;
  name: string;
}

export interface Store {
  code: string;
  name: string;
  responsible_email?: string;
  delivery_center_code: string;
  is_active: number;
  delivery_center_name?: string;
}

export interface User {
  email: string;
  store_id: string;
  name?: string;
  password_hash: string;
  is_active: number;
}

export interface Product {
  ean: string;
  ref?: string;
  title: string;
  description?: string;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
  image_url?: string;
  is_active: boolean | number; // Allow both boolean and number to handle different data sources
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  purchase_order_id: string;
  user_email: string;
  store_id: string;
  created_at: string;
  status: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
}

export interface PurchaseOrderItem {
  item_id?: number;
  purchase_order_id: string;
  item_ean: string;
  item_title?: string;
  item_description?: string;
  unit_of_measure?: string;
  quantity_measure?: number;
  image_url?: string;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
}

export interface Order {
  order_id: string;
  source_purchase_order_id: string;
  user_email: string;
  store_id: string;
  delivery_center_id: string;
  created_at: string;
  status: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
}

export interface OrderItem {
  item_id?: number;
  order_id: string;
  item_ean: string;
  item_title?: string;
  item_description?: string;
  unit_of_measure?: string;
  quantity_measure?: number;
  image_url?: string;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
}

export interface SyncEntity {
  entity_type: string; // 'products', 'stores', 'users', 'taxes', 'delivery_centers'
  last_sync: string; // ISO timestamp of last sync
  total_count?: number; // Total count from last sync
  created_at: string;
  updated_at: string;
}

export interface SyncConfig {
  entity: string;
  last_request: number;
  last_updated: number;
}

// IndexedDB Database Class
export class MusgraveDatabase extends Dexie {
  taxes!: Table<Tax>;
  delivery_centers!: Table<DeliveryCenter>;
  stores!: Table<Store>;
  users!: Table<User>;
  products!: Table<Product>;
  purchase_orders!: Table<PurchaseOrder>;
  purchase_order_items!: Table<PurchaseOrderItem>;
  orders!: Table<Order>;
  order_items!: Table<OrderItem>;
  sync_config!: Table<SyncConfig>;

  constructor() {
    super('MusgraveDB');
    
    this.version(1).stores({
      taxes: 'code, name, tax_rate',
      delivery_centers: 'code, name',
      stores: 'code, name, responsible_email, delivery_center_code, is_active',
      users: 'email, store_id, name, is_active',
      products: 'ean, ref, title, tax_code, is_active, unit_of_measure',
      purchase_orders: 'purchase_order_id, user_email, store_id, created_at, status',
      purchase_order_items: '++item_id, purchase_order_id, item_ean',
      orders: 'order_id, source_purchase_order_id, user_email, store_id, created_at, status',
      order_items: '++item_id, order_id, item_ean',
      sync_config: 'entity, last_request, last_updated'
    });
  }
}

// Global database instance
export const db = new MusgraveDatabase();

// Database operations
export class DatabaseService {
  // Initialize database
  static async initialize(): Promise<void> {
    try {
      await db.open();
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearDatabase(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
      }
    });
    console.log('Database cleared');
  }

  // Sync config operations
  static async getSyncConfig(entity: string): Promise<SyncConfig | undefined> {
    return await db.sync_config.where('entity').equals(entity).first();
  }

  static async updateSyncConfig(entity: string, lastUpdated: number): Promise<void> {
    const now = Date.now();
    await db.sync_config.put({
      entity,
      last_request: now,
      last_updated: lastUpdated
    });
  }

  static async needsSync(entity: string, serverLastUpdated: number): Promise<boolean> {
    const config = await this.getSyncConfig(entity);
    if (!config) {
      console.log(`🔄 ${entity}: First sync - no local config found`);
      return true;
    }
    
    const needsUpdate = serverLastUpdated > config.last_updated;
    console.log(`🔄 ${entity}: Local timestamp: ${config.last_updated}, Server timestamp: ${serverLastUpdated}, Needs sync: ${needsUpdate}`);
    return needsUpdate;
  }

  static async setSyncConfig(config: SyncConfig): Promise<void> {
    await db.sync_config.put(config);
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
      }
    });
    console.log('All IndexedDB data cleared');
  }

  // Add methods to insert data
  static async addTax(tax: any): Promise<void> {
    await db.taxes.put(tax);
  }

  static async addProduct(product: any): Promise<void> {
    await db.products.put(product);
  }

  static async addDeliveryCenter(center: any): Promise<void> {
    await db.delivery_centers.put(center);
  }

  static async addStore(store: any): Promise<void> {
    await db.stores.put(store);
  }

  static async addUser(user: any): Promise<void> {
    await db.users.put(user);
  }

  // Purchase order data insertion methods
  static async addPurchaseOrder(order: any): Promise<void> {
    await db.purchase_orders.put(order);
  }

  static async addPurchaseOrderItem(item: any): Promise<void> {
    await db.purchase_order_items.put(item);
  }

  // Order data insertion methods  
  static async addOrder(order: any): Promise<void> {
    await db.orders.put(order);
  }

  static async addOrderItem(item: any): Promise<void> {
    await db.order_items.put(item);
  }

  // User operations
  static async getUser(email: string): Promise<User | undefined> {
    return await db.users.where('email').equals(email).first();
  }

  static async getUserStore(email: string): Promise<(Store & { delivery_center_name?: string }) | null> {
    const user = await this.getUser(email);
    if (!user) return null;

    const store = await db.stores.where('code').equals(user.store_id).first();
    if (!store) return null;

    // Get delivery center name
    const deliveryCenter = await db.delivery_centers.where('code').equals(store.delivery_center_code).first();
    
    return {
      ...store,
      delivery_center_name: deliveryCenter?.name
    };
  }

  // Product operations
  static async getProducts(activeOnly: boolean = true): Promise<Product[]> {
    try {
      if (activeOnly) {
        // Filter by is_active using toArray() and filter() since is_active is not indexed
        const allProducts = await db.products.toArray();
        
        // DEBUG: Log first few products to see is_active values
        if (allProducts.length > 0) {
          console.log(`DEBUG: First product is_active value:`, allProducts[0].is_active, `(type: ${typeof allProducts[0].is_active})`);
          console.log(`DEBUG: Sample product data:`, {
            ean: allProducts[0].ean,
            title: allProducts[0].title,
            is_active: allProducts[0].is_active
          });
        }
        
        const activeProducts = allProducts.filter(product => 
          product.is_active === true || product.is_active === 1
        );
        
        console.log(`IndexedDB getProducts returned ${activeProducts.length} active products from ${allProducts.length} total`);
        return activeProducts;
      }
      return await db.products.toArray();
    } catch (error) {
      console.error('Error getting products from IndexedDB:', error);
      return [];
    }
  }

  static async getProduct(ean: string): Promise<Product | undefined> {
    return await db.products.where('ean').equals(ean).first();
  }

  static async searchProducts(query: string): Promise<Product[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const allProducts = await db.products.toArray();
      
      return allProducts.filter(product => 
        (product.is_active === true || product.is_active === 1) &&
        (product.title.toLowerCase().includes(lowerQuery) ||
         product.ean.includes(query) ||
         (product.ref?.toLowerCase().includes(lowerQuery) || false))
      );
    } catch (error) {
      console.error('Error searching products in IndexedDB:', error);
      return [];
    }
  }

  // Tax operations
  static async getTax(code: string): Promise<Tax | undefined> {
    return await db.taxes.where('code').equals(code).first();
  }

  // Purchase order operations
  static async savePurchaseOrder(order: PurchaseOrder, items: PurchaseOrderItem[]): Promise<void> {
    await db.transaction('rw', [db.purchase_orders, db.purchase_order_items], async () => {
      await db.purchase_orders.put(order);
      await db.purchase_order_items.bulkPut(items);
    });
  }

  static async getPurchaseOrders(userEmail: string): Promise<PurchaseOrder[]> {
    if (!userEmail) {
      // If no email provided, get all orders for debugging
      return await db.purchase_orders.orderBy('created_at').reverse().toArray();
    }
    return await db.purchase_orders
      .where('user_email').equals(userEmail)
      .reverse()
      .sortBy('created_at');
  }

  // Get purchase orders for user (alias for compatibility)
  static async getPurchaseOrdersForUser(userEmail: string): Promise<any[]> {
    return await this.getPurchaseOrders(userEmail);
  }

  static async getPurchaseOrder(orderId: string): Promise<PurchaseOrder | undefined> {
    return await db.purchase_orders.where('purchase_order_id').equals(orderId).first();
  }

  static async getPurchaseOrderItems(orderId: string): Promise<PurchaseOrderItem[]> {
    return await db.purchase_order_items.where('purchase_order_id').equals(orderId).toArray();
  }

  // Order operations  
  static async getOrders(userEmail: string): Promise<Order[]> {
    if (!userEmail) {
      // If no email provided, get all orders for debugging
      return await db.orders.orderBy('created_at').reverse().toArray();
    }
    return await db.orders
      .where('user_email').equals(userEmail)
      .reverse()
      .sortBy('created_at');
  }

  static async getOrder(orderId: string): Promise<Order | undefined> {
    return await db.orders.where('order_id').equals(orderId).first();
  }

  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.order_items.where('order_id').equals(orderId).toArray();
  }

  // Get orders for user (alias for compatibility)
  static async getOrdersForUser(userEmail: string): Promise<Order[]> {
    return await this.getOrders(userEmail);
  }

  // Bulk sync operations
  static async syncTaxes(taxes: Tax[]): Promise<void> {
    await db.taxes.clear();
    await db.taxes.bulkAdd(taxes);
  }

  static async syncDeliveryCenters(centers: DeliveryCenter[]): Promise<void> {
    await db.delivery_centers.clear();
    await db.delivery_centers.bulkAdd(centers);
  }

  static async syncStores(stores: Store[]): Promise<void> {
    await db.stores.clear();
    await db.stores.bulkAdd(stores);
  }

  static async syncUsers(users: User[]): Promise<void> {
    await db.users.clear();
    await db.users.bulkAdd(users);
  }

  // Store operations
  static async getStore(code: string): Promise<Store | undefined> {
    return await db.stores.where('code').equals(code).first();
  }

  static async syncProducts(products: Product[]): Promise<void> {
    await db.products.clear();
    
    // Insert products in batches for better performance
    const batchSize = 1000;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await db.products.bulkAdd(batch);
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} - ${Math.min(i + batchSize, products.length)}/${products.length} products`);
    }
  }

  // Database statistics
  static async getDatabaseStats(): Promise<{
    taxes: number;
    delivery_centers: number;
    stores: number;
    users: number;
    products: number;
    active_products: number;
    purchase_orders: number;
    orders: number;
  }> {
    const [taxes, delivery_centers, stores, users, allProducts, purchase_orders, orders] = await Promise.all([
      db.taxes.count(),
      db.delivery_centers.count(),
      db.stores.count(),
      db.users.count(),
      db.products.toArray(),
      db.purchase_orders.count(),
      db.orders.count()
    ]);

    return {
      taxes,
      delivery_centers,
      stores,
      users,
      products: allProducts.length,
      active_products: allProducts.filter(p => p.is_active === 1).length,
      purchase_orders,
      orders
    };
  }
}