// IndexedDB-only database service
import { DatabaseService as IndexedDBService } from './indexeddb';

export type StorageType = 'indexeddb';

let currentStorageType: StorageType = 'indexeddb'; // Only IndexedDB supported

export function setStorageType(type: StorageType) {
  if (type !== 'indexeddb') {
    console.warn(`Unsupported storage type: ${type}. Using IndexedDB.`);
    currentStorageType = 'indexeddb';
  } else {
    currentStorageType = type;
  }
  console.log(`Database service using: ${currentStorageType}`);
}

export function getCurrentStorageType(): StorageType {
  return currentStorageType;
}

// Simplified database service for IndexedDB only
export class DatabaseService {
  
  // Get all products with optional search
  static async getProducts(searchTerm?: string): Promise<any[]> {
    console.log(`DatabaseService.getProducts called with searchTerm: "${searchTerm}"`);
    
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
  }

  // Get product by EAN
  static async getProductByEan(ean: string): Promise<any | null> {
    console.log(`DatabaseService.getProductByEan called for EAN: ${ean}`);
    
    try {
      const product = await IndexedDBService.getProduct(ean);
      console.log(`IndexedDB getProductByEan returned:`, product ? 'found' : 'not found');
      return product || null;
    } catch (error) {
      console.error('Error getting product by EAN from IndexedDB:', error);
      return null;
    }
  }

  // Get tax rate by code
  static async getTaxRate(taxCode: string): Promise<number> {
    console.log(`DatabaseService.getTaxRate called for code: ${taxCode}`);
    
    try {
      const tax = await IndexedDBService.getTax(taxCode);
      const rate = tax ? tax.tax_rate : 0.21; // Default to 21% IVA
      console.log(`IndexedDB getTaxRate returned: ${rate} for code ${taxCode}`);
      return rate;
    } catch (error) {
      console.error('Error getting tax rate from IndexedDB:', error);
      return 0.21; // Default fallback
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<any | null> {
    console.log(`DatabaseService.getUserByEmail called for: ${email}`);
    
    try {
      const user = await IndexedDBService.getUser(email);
      console.log(`IndexedDB getUserByEmail returned:`, user ? 'found' : 'not found');
      return user || null;
    } catch (error) {
      console.error('Error getting user from IndexedDB:', error);
      return null;
    }
  }

  // Add user
  static async addUser(user: any): Promise<void> {
    console.log(`DatabaseService.addUser called for: ${user.email}`);
    
    try {
      await IndexedDBService.addUser(user);
      console.log(`IndexedDB addUser completed for: ${user.email}`);
    } catch (error) {
      console.error('Error adding user to IndexedDB:', error);
      throw error;
    }
  }

  // Get store by code
  static async getStoreByCode(code: string): Promise<any | null> {
    console.log(`DatabaseService.getStoreByCode called for: ${code}`);
    
    try {
      const store = await IndexedDBService.getStore(code);
      console.log(`IndexedDB getStoreByCode returned:`, store ? 'found' : 'not found');
      return store || null;
    } catch (error) {
      console.error('Error getting store from IndexedDB:', error);
      return null;
    }
  }

  // Purchase order operations
  static async createPurchaseOrder(order: any): Promise<void> {
    console.log(`DatabaseService.createPurchaseOrder called for: ${order.purchase_order_id}`);
    
    try {
      await IndexedDBService.addPurchaseOrder(order);
      console.log(`IndexedDB createPurchaseOrder completed for: ${order.purchase_order_id}`);
    } catch (error) {
      console.error('Error creating purchase order in IndexedDB:', error);
      throw error;
    }
  }

  static async addPurchaseOrderItem(item: any): Promise<void> {
    console.log(`DatabaseService.addPurchaseOrderItem called for order: ${item.purchase_order_id}`);
    
    try {
      await IndexedDBService.addPurchaseOrderItem(item);
      console.log(`IndexedDB addPurchaseOrderItem completed`);
    } catch (error) {
      console.error('Error adding purchase order item to IndexedDB:', error);
      throw error;
    }
  }

  static async getPurchaseOrdersForUser(userEmail: string): Promise<any[]> {
    console.log(`DatabaseService.getPurchaseOrdersForUser called for: ${userEmail}`);
    
    try {
      const orders = await IndexedDBService.getPurchaseOrdersForUser(userEmail);
      console.log(`IndexedDB getPurchaseOrdersForUser returned ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('Error getting purchase orders from IndexedDB:', error);
      return [];
    }
  }

  static async getPurchaseOrderItems(purchaseOrderId: string): Promise<any[]> {
    console.log(`DatabaseService.getPurchaseOrderItems called for: ${purchaseOrderId}`);
    
    try {
      const items = await IndexedDBService.getPurchaseOrderItems(purchaseOrderId);
      console.log(`IndexedDB getPurchaseOrderItems returned ${items.length} items`);
      return items;
    } catch (error) {
      console.error('Error getting purchase order items from IndexedDB:', error);
      return [];
    }
  }

  // Regular order operations
  static async createOrder(order: any): Promise<void> {
    console.log(`DatabaseService.createOrder called for: ${order.order_id}`);
    
    try {
      await IndexedDBService.addOrder(order);
      console.log(`IndexedDB createOrder completed for: ${order.order_id}`);
    } catch (error) {
      console.error('Error creating order in IndexedDB:', error);
      throw error;
    }
  }

  static async addOrderItem(item: any): Promise<void> {
    console.log(`DatabaseService.addOrderItem called for order: ${item.order_id}`);
    
    try {
      await IndexedDBService.addOrderItem(item);
      console.log(`IndexedDB addOrderItem completed`);
    } catch (error) {
      console.error('Error adding order item to IndexedDB:', error);
      throw error;
    }
  }

  static async getOrdersForUser(userEmail: string): Promise<any[]> {
    console.log(`DatabaseService.getOrdersForUser called for: ${userEmail}`);
    
    try {
      const orders = await IndexedDBService.getOrdersForUser(userEmail);
      console.log(`IndexedDB getOrdersForUser returned ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('Error getting orders from IndexedDB:', error);
      return [];
    }
  }

  static async getOrderItems(orderId: string): Promise<any[]> {
    console.log(`DatabaseService.getOrderItems called for: ${orderId}`);
    
    try {
      const items = await IndexedDBService.getOrderItems(orderId);
      console.log(`IndexedDB getOrderItems returned ${items.length} items`);
      return items;
    } catch (error) {
      console.error('Error getting order items from IndexedDB:', error);
      return [];
    }
  }

  // Sync config operations
  static async getSyncConfig(entity: string): Promise<any | null> {
    try {
      return await IndexedDBService.getSyncConfig(entity);
    } catch (error) {
      console.error('Error getting sync config from IndexedDB:', error);
      return null;
    }
  }

  static async updateSyncConfig(entity: string, timestamp: number): Promise<void> {
    try {
      await IndexedDBService.updateSyncConfig(entity, timestamp);
    } catch (error) {
      console.error('Error updating sync config in IndexedDB:', error);
      throw error;
    }
  }

  // Data management operations
  static async addProduct(product: any): Promise<void> {
    try {
      await IndexedDBService.addProduct(product);
    } catch (error) {
      console.error('Error adding product to IndexedDB:', error);
      throw error;
    }
  }

  static async addTax(tax: any): Promise<void> {
    try {
      await IndexedDBService.addTax(tax);
    } catch (error) {
      console.error('Error adding tax to IndexedDB:', error);
      throw error;
    }
  }

  static async addStore(store: any): Promise<void> {
    try {
      await IndexedDBService.addStore(store);
    } catch (error) {
      console.error('Error adding store to IndexedDB:', error);
      throw error;
    }
  }

  static async addDeliveryCenter(center: any): Promise<void> {
    try {
      await IndexedDBService.addDeliveryCenter(center);
    } catch (error) {
      console.error('Error adding delivery center to IndexedDB:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await IndexedDBService.clearAllData();
    } catch (error) {
      console.error('Error clearing all data from IndexedDB:', error);
      throw error;
    }
  }

  static async updatePurchaseOrderServerSentAt(purchaseOrderId: string, serverSentAt: string): Promise<void> {
    try {
      await IndexedDBService.updatePurchaseOrderServerSentAt(purchaseOrderId, serverSentAt);
    } catch (error) {
      console.error('Error updating purchase order server_sent_at:', error);
      throw error;
    }
  }

  static async updatePurchaseOrderStatus(purchaseOrderId: string, status: string): Promise<void> {
    try {
      await IndexedDBService.updatePurchaseOrderStatus(purchaseOrderId, status);
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  }

  static async updatePurchaseOrder(purchaseOrderId: string, updates: any): Promise<void> {
    try {
      await IndexedDBService.updatePurchaseOrder(purchaseOrderId, updates);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  static async clearPurchaseOrderItems(purchaseOrderId: string): Promise<void> {
    try {
      await IndexedDBService.clearPurchaseOrderItems(purchaseOrderId);
    } catch (error) {
      console.error('Error clearing purchase order items:', error);
      throw error;
    }
  }
}

// For backward compatibility, export as UnifiedDatabaseService too
export const UnifiedDatabaseService = DatabaseService;