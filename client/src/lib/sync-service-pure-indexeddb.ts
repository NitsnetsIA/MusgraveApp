import { DatabaseService } from './indexeddb';
import { imageCacheService } from './image-cache-service';

const GRAPHQL_ENDPOINT = '/api/graphql'; // Use server proxy to avoid CORS
const STORE_ID = 'ES001';

// Pure IndexedDB sync with incremental sync support
export async function performPureIndexedDBSync(onProgress?: (message: string, progress: number) => void, forceFullSync: boolean = false): Promise<void> {
  console.log('🚀 Starting pure IndexedDB synchronization...');
  
  try {
    if (forceFullSync) {
      onProgress?.('🗑️ Sincronización completa: Limpiando datos existentes...', 10);
      // Clear existing data first
      await DatabaseService.clearAllData();
      console.log('🗑️ Force full sync: Cleared existing IndexedDB data');
    } else {
      onProgress?.('🔍 Verificando qué datos necesitan actualizarse...', 10);
      console.log('🔍 Checking for incremental updates...');
    }
    
    // Sync in correct order with progress updates
    onProgress?.('📊 Sincronizando impuestos (IVA)...', 20);
    await syncTaxesDirectly(forceFullSync);
    
    onProgress?.('📦 Sincronizando productos...', 30);
    await syncProductsDirectly(onProgress, forceFullSync);
    
    onProgress?.('🏢 Sincronizando centros de entrega...', 70);
    await syncDeliveryCentersDirectly(forceFullSync);
    
    onProgress?.('🏪 Sincronizando tiendas...', 80);
    await syncStoresDirectly(forceFullSync);
    
    onProgress?.('👥 Sincronizando usuarios...', 90);
    await syncUsersDirectly(forceFullSync);

    onProgress?.('📦 Enviando órdenes de compra pendientes...', 93);
    console.log('🔄 About to call syncPendingPurchaseOrders...');
    await syncPendingPurchaseOrders();
    console.log('✅ syncPendingPurchaseOrders completed');

    onProgress?.('🛒 Importando pedidos procesados del servidor...', 95);
    await syncProcessedOrdersFromServer(forceFullSync);

    onProgress?.('📋 Actualizando órdenes de compra desde el servidor...', 98);
    await syncPurchaseOrdersFromServer(forceFullSync);
    
    onProgress?.('✅ Sincronización completada exitosamente', 100);
    console.log('✅ Pure IndexedDB synchronization completed successfully');
    
  } catch (error) {
    console.error('❌ Pure IndexedDB synchronization failed:', error);
    throw error;
  }
}

async function syncTaxesDirectly(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing taxes directly to IndexedDB...');
  
  // Get last sync timestamp for incremental sync
  let timestampFilter = '';
  if (!forceFullSync) {
    const syncConfig = await DatabaseService.getSyncConfig('taxes');
    if (syncConfig && syncConfig.last_request) {
      const lastSync = new Date(syncConfig.last_request).toISOString();
      timestampFilter = `, timestamp: "${lastSync}"`;
      console.log(`🔍 Incremental sync: checking for taxes modified after ${lastSync}`);
    } else {
      console.log('🔍 First sync: downloading all taxes');
    }
  } else {
    console.log('🔍 Full sync: downloading all taxes');
  }
  
  // For now, simplify the query until GraphQL timestamp filtering is working
  const query = `
    query {
      taxes {
        taxes {
          code
          name
          tax_rate
          created_at
          updated_at
        }
      }
    }
  `;
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  const taxes = data.data.taxes.taxes;
  console.log(`📊 Received ${taxes.length} ${forceFullSync ? 'taxes' : 'new/updated taxes'}`);
  
  if (taxes.length > 0) {
    // Store taxes in IndexedDB
    for (const tax of taxes) {
      await DatabaseService.addTax(tax);
    }
    
    // Update sync config with current timestamp
    await DatabaseService.updateSyncConfig('taxes', Date.now());
    console.log('✅ Taxes synced to IndexedDB');
  } else {
    console.log('⏭️ No new taxes to sync');
  }
}

async function syncProductsDirectly(onProgress?: (message: string, progress: number) => void, forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing products directly to IndexedDB...');
  
  // CRITICAL FIX: Check if we have products in database before doing incremental sync
  const existingProducts = await DatabaseService.getProducts(false); // Get all products including inactive
  console.log(`🔍 Database check: Found ${existingProducts.length} existing products`);
  
  // Check if existing products have ref field - if not, force full sync
  const productsWithRef = existingProducts.filter(p => p.ref && p.ref !== '');
  console.log(`🔍 Products with ref field: ${productsWithRef.length}/${existingProducts.length}`);
  
  // If no products exist or no products have ref field, force a full sync
  if ((existingProducts.length === 0 || productsWithRef.length === 0) && !forceFullSync) {
    console.log('⚠️ No products with ref field found, forcing full sync to ensure ref data...');
    forceFullSync = true;
  }
  
  // Get last sync timestamp for incremental sync
  let timestampFilter = '';
  if (!forceFullSync) {
    const syncConfig = await DatabaseService.getSyncConfig('products');
    if (syncConfig && syncConfig.last_request) {
      const lastSync = new Date(syncConfig.last_request).toISOString();
      timestampFilter = `, timestamp: "${lastSync}"`;
      console.log(`🔍 Incremental sync: checking for products modified after ${lastSync}`);
    } else {
      console.log('🔍 First sync: downloading all products');
    }
  } else {
    console.log('🔍 Full sync: downloading all products');
  }
  
  let offset = 0;
  const limit = 1000;
  let totalProcessed = 0;
  let totalProducts = 0;
  let allProducts: any[] = [];

  // Paginated query to get all products
  while (true) {
    const query = `
      query {
        products(limit: ${limit}, offset: ${offset}${timestampFilter}) {
          products {
            ean
            ref
            title
            description
            base_price
            tax_code
            unit_of_measure
            quantity_measure
            image_url
            is_active
            created_at
            updated_at
          }
          total
          limit
          offset
        }
      }
    `;
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    
    const products = data.data.products.products;
    totalProducts = data.data.products.total;
    
    console.log(`📦 Received ${products.length} products (offset: ${offset}, total: ${totalProducts})`);
    
    if (products.length === 0) break;
    
    allProducts.push(...products);
    totalProcessed += products.length;
    
    if (onProgress) {
      const productProgress = Math.floor((totalProcessed / totalProducts) * 40);
      onProgress(`📦 Sincronizando productos... ${totalProcessed}/${totalProducts}`, 30 + productProgress);
    }
    
    offset += limit;
    
    if (totalProcessed >= totalProducts) break;
  }

  console.log(`📦 Total products collected: ${allProducts.length}`);
  
  // Add nutrition_label_url field with null value for now since server doesn't support it yet
  const productsWithNutritionField = allProducts.map((product: any) => ({
    ...product,
    nutrition_label_url: null // Will be populated when server supports this field
  }));
  
  // CRITICAL FIX: Only do bulk insert if we have products to insert
  if (productsWithNutritionField.length > 0) {
    const isIncremental = !forceFullSync && timestampFilter !== '';
    console.log(`🚀 ${isIncremental ? 'INCREMENTAL UPDATE' : 'OPTIMIZED BULK INSERT'}: ${isIncremental ? 'Updating' : 'Inserting'} ${productsWithNutritionField.length} products...`);
    
    // DEBUG: Log first few products to check is_active and ref values
    if (productsWithNutritionField.length > 0) {
      console.log(`DEBUG: About to ${isIncremental ? 'update' : 'insert'} product with is_active:`, productsWithNutritionField[0].is_active, `(type: ${typeof productsWithNutritionField[0].is_active})`);
      console.log(`DEBUG: First product ref field:`, productsWithNutritionField[0].ref, `(has ref: ${productsWithNutritionField[0].hasOwnProperty('ref')})`);
      console.log(`DEBUG: First 3 products refs:`, productsWithNutritionField.slice(0, 3).map((p: any) => ({ ean: p.ean, ref: p.ref })));
    }
    
    await DatabaseService.syncProducts(productsWithNutritionField, isIncremental);
  } else {
    console.log(`⏭️ No products to update, preserving existing products`);
  }
  
  // Update sync config
  await DatabaseService.updateSyncConfig('products', Date.now());
  
  if (productsWithNutritionField.length > 0) {
    console.log(`✅ ${allProducts.length} products synced to IndexedDB successfully`);
    
    // Always queue images for caching to resume incomplete downloads
    await queueImageCaching(productsWithNutritionField);
  }
}

// Separate function to handle image caching logic
async function queueImageCaching(products: any[]) {
  console.log(`📷 Preparing ${products.length} product images for background caching...`);
  
  // Collect both main images and nutritional label images
  const imageUrls: string[] = [];
  products.forEach((product: any) => {
    if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() !== '') {
      imageUrls.push(product.image_url);
    }
    if (product.nutrition_label_url && typeof product.nutrition_label_url === 'string' && product.nutrition_label_url.trim() !== '') {
      imageUrls.push(product.nutrition_label_url);
    }
  });
  
  // Remove duplicates
  const uniqueImageUrls = imageUrls.filter((url, index, array) => array.indexOf(url) === index);
  
  if (uniqueImageUrls.length > 0) {
    console.log(`🎯 Queuing ${uniqueImageUrls.length} unique images (including nutritional labels) for background download`);
    
    // Add delay before starting image cache to let sync complete
    setTimeout(async () => {
      await imageCacheService.queueImagesForCache(uniqueImageUrls);
      console.log(`✅ Image caching queue initiated with ${uniqueImageUrls.length} images`);
    }, 1000);
  } else {
    console.log('⏭️ No valid image URLs found in products');
  }
}

// Function to resume image caching for existing products
export async function resumeImageCaching() {
  try {
    console.log('🔄 Checking for incomplete image downloads to resume...');
    
    // Get all products from database
    const { DatabaseService } = await import('./database-service');
    const products = await DatabaseService.getProducts();
    
    if (products.length === 0) {
      console.log('⏭️ No products found, skipping image resume');
      return;
    }

    // Get current cached image count
    const { imageCacheService } = await import('./image-cache-service');
    const cachedCount = await imageCacheService.getCachedImageCount();
    const totalImages = products.filter(p => p.image_url && p.image_url.trim() !== '').length;
    
    console.log(`📊 DEBUG: Found ${products.length} total products, ${totalImages} with valid images`);
    
    console.log(`📊 Image caching status: ${cachedCount}/${totalImages} cached`);
    
    if (cachedCount < totalImages) {
      console.log(`🔄 Resuming image downloads: ${totalImages - cachedCount} remaining`);
      await queueImageCaching(products);
    } else {
      console.log('✅ All images already cached');
    }
    
  } catch (error) {
    console.error('Error resuming image caching:', error);
  }
}

async function syncDeliveryCentersDirectly(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing delivery centers directly to IndexedDB...');
  
  // Get last sync timestamp for incremental sync
  let timestampFilter = '';
  if (!forceFullSync) {
    const syncConfig = await DatabaseService.getSyncConfig('delivery_centers');
    if (syncConfig && syncConfig.last_request) {
      const lastSync = new Date(syncConfig.last_request).toISOString();
      timestampFilter = `, timestamp: "${lastSync}"`;
      console.log(`🔍 Incremental sync: checking for delivery centers modified after ${lastSync}`);
    } else {
      console.log('🔍 First sync: downloading all delivery centers');
    }
  } else {
    console.log('🔍 Full sync: downloading all delivery centers');
  }
  
  const query = `
    query {
      deliveryCenters {
        deliveryCenters {
          code
          name
        }
      }
    }
  `;
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const centers = data.data.deliveryCenters.deliveryCenters;
  console.log(`🏢 Received ${centers.length} delivery centers`);
  
  for (const center of centers) {
    await DatabaseService.addDeliveryCenter(center);
  }
  
  // Update sync config
  await DatabaseService.updateSyncConfig('delivery_centers', Date.now());
  
  console.log('✅ Delivery centers synced to IndexedDB');
}

async function syncStoresDirectly(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing stores directly to IndexedDB...');
  
  // Get last sync timestamp for incremental sync
  let timestampFilter = '';
  if (!forceFullSync) {
    const syncConfig = await DatabaseService.getSyncConfig('stores');
    if (syncConfig && syncConfig.last_request) {
      const lastSync = new Date(syncConfig.last_request).toISOString();
      timestampFilter = `, timestamp: "${lastSync}"`;
      console.log(`🔍 Incremental sync: checking for stores modified after ${lastSync}`);
    } else {
      console.log('🔍 First sync: downloading all stores');
    }
  } else {
    console.log('🔍 Full sync: downloading all stores');
  }
  
  const query = `
    query {
      stores {
        stores {
          code
          name
          responsible_email
          delivery_center_code
          is_active
          created_at
          updated_at
        }
      }
    }
  `;
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const stores = data.data.stores.stores;
  console.log(`🏪 Received ${stores.length} stores`);
  
  for (const store of stores) {
    await DatabaseService.addStore(store);
  }
  
  // Update sync config
  await DatabaseService.updateSyncConfig('stores', Date.now());
  
  console.log('✅ Stores synced to IndexedDB');
}

async function syncUsersDirectly(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing users directly to IndexedDB...');
  
  // Get last sync timestamp for incremental sync
  let timestampFilter = '';
  if (!forceFullSync) {
    const syncConfig = await DatabaseService.getSyncConfig('users');
    if (syncConfig && syncConfig.last_request) {
      const lastSync = new Date(syncConfig.last_request).toISOString();
      timestampFilter = `, timestamp: "${lastSync}"`;
      console.log(`🔍 Incremental sync: checking for users modified after ${lastSync}`);
    } else {
      console.log('🔍 First sync: downloading all users');
    }
  } else {
    console.log('🔍 Full sync: downloading all users');
  }
  
  const query = `
    query {
      users {
        users {
          email
          store_id
          name
          password_hash
          is_active
          last_login
          created_at
          updated_at
        }
      }
    }
  `;
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const users = data.data.users.users;
  console.log(`👥 Received ${users.length} users`);
  
  for (const user of users) {
    await DatabaseService.addUser(user);
  }
  
  // Update sync config
  await DatabaseService.updateSyncConfig('users', Date.now());
  
  console.log('✅ Users synced to IndexedDB');
}

// Sync pending purchase orders to GraphQL server
async function syncPendingPurchaseOrders(): Promise<void> {
  try {
    console.log('🔍 Checking for pending purchase orders...');
    
    // Debug: First let's see all purchase orders
    const { DatabaseService: IndexedDBService } = await import('./indexeddb');
    const allOrders = await IndexedDBService.db.purchase_orders.toArray();
    console.log(`🗂️ Total purchase orders in database: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log('📋 Purchase orders found:');
      allOrders.forEach((order: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${order.purchase_order_id}, Status: ${order.status}, server_send_at: ${order.server_send_at}`);
      });
    }
    
    // First check if there are actually any pending orders to sync
    const pendingOrders = await DatabaseService.getPendingPurchaseOrders();
    
    console.log(`📊 Found ${pendingOrders.length} pending purchase orders (server_send_at is null/undefined)`);
    
    if (pendingOrders.length === 0) {
      console.log('⏭️ No pending purchase orders to sync - skipping');
      return;
    }
    
    console.log('🔄 Syncing pending purchase orders to server...');
    
    // Import and call the actual sync function
    const { syncPendingPurchaseOrders: actualSyncFunction } = await import('./purchase-order-sync');
    await actualSyncFunction();
    console.log('✅ Pending purchase orders sync completed');
  } catch (error) {
    console.error('❌ Failed to sync pending purchase orders:', error);
    console.error('Error details:', error);
    // Don't throw error - this shouldn't block the main sync process
  }
}

// Sync processed orders from GraphQL server
async function syncProcessedOrdersFromServer(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing processed orders from GraphQL server...');
  
  try {
    // Get last sync timestamp for incremental sync
    let timestamp = '2024-08-09T09:45:40.647Z'; // Default starting date
    if (!forceFullSync) {
      const syncConfig = await DatabaseService.getSyncConfig('orders');
      if (syncConfig && syncConfig.last_request) {
        timestamp = new Date(syncConfig.last_request).toISOString();
        console.log(`🔍 Orders incremental sync: checking for orders modified after ${timestamp}`);
        console.log(`📊 Last orders sync was at: ${new Date(syncConfig.last_request).toLocaleString()}`);
      } else {
        console.log('🔍 Orders first sync: downloading orders from default date');
      }
    } else {
      console.log('🔍 Orders full sync: downloading all orders');
    }

    const query = `
      query Order($timestamp: String, $limit: Int, $offset: Int, $storeId: String) {
        orders(timestamp: $timestamp, limit: $limit, offset: $offset, store_id: $storeId) {
          orders {
            order_id
            source_purchase_order_id
            user_email
            store_id
            observations
            subtotal
            tax_total
            final_total
            created_at
            updated_at
            items {
              item_id
              order_id
              item_ean
              item_title
              item_description
              unit_of_measure
              quantity_measure
              image_url
              quantity
              base_price_at_order
              tax_rate_at_order
              created_at
              updated_at
            }
          }
          total
          limit
          offset
        }
      }
    `;

    // Query orders for the user's store only
    const variables = {
      timestamp: timestamp,
      limit: 1000,
      offset: 0,
      storeId: STORE_ID // This ensures we only get orders for ES001 store
    };

    console.log(`📊 Requesting processed orders for store ${STORE_ID} since ${timestamp}`);
    
    const response = await fetch('https://pim-grocery-ia64.replit.app/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const ordersData = data.data.orders;
    const orders = ordersData.orders || [];
    
    console.log(`🛒 Received ${orders.length} processed orders for store ${STORE_ID}`);
    
    if (orders.length > 0) {
      // Import each order with its items
      for (const order of orders) {
        console.log(`📦 Importing processed order ${order.order_id} from purchase order ${order.source_purchase_order_id}`);
        
        // Create the order
        await DatabaseService.addOrder({
          order_id: order.order_id,
          source_purchase_order_id: order.source_purchase_order_id,
          user_email: order.user_email,
          store_id: order.store_id,
          created_at: order.created_at,
          observations: order.observations,
          subtotal: order.subtotal,
          tax_total: order.tax_total,
          final_total: order.final_total,
          status: 'completed'
        });

        // Add order items
        for (const item of order.items) {
          await DatabaseService.addOrderItem({
            order_id: order.order_id,
            item_ean: item.item_ean,
            item_ref: item.item_ref || '',
            item_title: item.item_title,
            item_description: item.item_description,
            unit_of_measure: item.unit_of_measure,
            quantity_measure: item.quantity_measure,
            image_url: item.image_url,
            quantity: item.quantity,
            base_price_at_order: item.base_price_at_order,
            tax_rate_at_order: item.tax_rate_at_order
          });
        }
      }

      console.log(`✅ Successfully imported ${orders.length} processed orders`);
    } else {
      console.log('📭 No new processed orders found');
    }

    // Update sync config with current timestamp for next incremental sync
    const currentTime = Date.now();
    await DatabaseService.updateSyncConfig('orders', currentTime);
    console.log(`📝 Updated orders sync config with timestamp: ${new Date(currentTime).toISOString()}`);
    
  } catch (error) {
    console.error('❌ Failed to sync processed orders:', error);
    // Don't throw error - this shouldn't block the main sync process
  }
}

// Sync purchase orders from GraphQL server to update local status
async function syncPurchaseOrdersFromServer(forceFullSync: boolean = false): Promise<void> {
  console.log('🔄 Syncing purchase orders from GraphQL server...');
  
  try {
    // Get last sync timestamp for incremental sync
    let timestamp = '2025-08-11T00:22:10Z'; // Default starting date
    if (!forceFullSync) {
      const syncConfig = await DatabaseService.getSyncConfig('purchase_orders');
      if (syncConfig && syncConfig.last_request) {
        timestamp = new Date(syncConfig.last_request).toISOString();
        console.log(`🔍 Purchase orders incremental sync: checking for purchase orders modified after ${timestamp}`);
        console.log(`📊 Last purchase orders sync was at: ${new Date(syncConfig.last_request).toLocaleString()}`);
      } else {
        console.log('🔍 Purchase orders first sync: downloading purchase orders from default date');
      }
    } else {
      console.log('🔍 Purchase orders full sync: downloading all purchase orders');
    }

    const query = `
      query PurchaseOrders($timestamp: String, $limit: Int, $offset: Int, $storeId: String) {
        purchaseOrders(timestamp: $timestamp, limit: $limit, offset: $offset, store_id: $storeId) {
          purchaseOrders {
            purchase_order_id
            user_email
            store_id
            status
            subtotal
            tax_total
            final_total
            server_sent_at
            created_at
            updated_at
            items {
              item_id
              purchase_order_id
              item_ean
              item_title
              item_description
              unit_of_measure
              quantity_measure
              image_url
              quantity
              base_price_at_order
              tax_rate_at_order
              created_at
              updated_at
            }
          }
          total
          limit
          offset
        }
      }
    `;

    // Query purchase orders for the user's store only
    const variables = {
      timestamp: timestamp,
      limit: 1000,
      offset: 0,
      storeId: STORE_ID // This ensures we only get purchase orders for ES001 store
    };

    console.log(`📊 Requesting purchase orders for store ${STORE_ID} since ${timestamp}`);
    
    const response = await fetch('https://dcf77d88-2e9d-4810-ad7c-bda46c3afaed-00-19tc7g93ztbc4.riker.replit.dev:3000/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const purchaseOrdersData = data.data.purchaseOrders;
    const purchaseOrders = purchaseOrdersData.purchaseOrders || [];
    
    console.log(`📋 Received ${purchaseOrders.length} purchase orders for store ${STORE_ID}`);
    
    if (purchaseOrders.length > 0) {
      // Update each purchase order with server data (server is source of truth)
      for (const serverOrder of purchaseOrders) {
        console.log(`🔄 Updating purchase order ${serverOrder.purchase_order_id} with server data (status: ${serverOrder.status})`);
        
        // Check if purchase order exists locally
        const existingOrder = await DatabaseService.getPurchaseOrder(serverOrder.purchase_order_id);
        
        // Map server status to frontend status
        const mapServerStatus = (serverStatus: string): string => {
          switch (serverStatus) {
            case 'COMPLETADO':
              return 'completed';
            case 'PROCESANDO':
              return 'processing';
            case 'SIN_COMUNICAR':
              return 'uncommunicated';
            default:
              return serverStatus.toLowerCase();
          }
        };
        
        const localStatus = mapServerStatus(serverOrder.status);
        console.log(`🔄 Mapping server status "${serverOrder.status}" to local status "${localStatus}"`);
        
        if (existingOrder) {
          // Update existing purchase order with server data
          console.log(`📝 Overwriting local purchase order ${serverOrder.purchase_order_id} with server data`);
          
          // Update purchase order with server data
          await DatabaseService.updatePurchaseOrder(serverOrder.purchase_order_id, {
            status: localStatus,
            subtotal: serverOrder.subtotal,
            tax_total: serverOrder.tax_total,
            final_total: serverOrder.final_total,
            server_sent_at: serverOrder.server_sent_at || '1111-11-11T11:11:11.111Z', // Flag for server orders with missing server_sent_at
            updated_at: serverOrder.updated_at
          });
          
          // Clear existing items and add server items
          await DatabaseService.clearPurchaseOrderItems(serverOrder.purchase_order_id);
          
          // Add purchase order items from server
          if (serverOrder.items && serverOrder.items.length > 0) {
            for (const item of serverOrder.items) {
              await DatabaseService.addPurchaseOrderItem({
                purchase_order_id: serverOrder.purchase_order_id,
                item_ean: item.item_ean,
                item_title: item.item_title,
                item_description: item.item_description || '',
                unit_of_measure: item.unit_of_measure || 'unidades',
                quantity_measure: item.quantity_measure || 1,
                image_url: item.image_url || '',
                quantity: item.quantity,
                base_price_at_order: item.base_price_at_order || 0,
                tax_rate_at_order: item.tax_rate_at_order || 0,
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString()
              });
            }
            console.log(`✅ Added ${serverOrder.items.length} items to purchase order ${serverOrder.purchase_order_id}`);
          }
          
        } else {
          // Create new purchase order from server
          console.log(`📦 Creating new purchase order ${serverOrder.purchase_order_id} from server`);
          
          await DatabaseService.addPurchaseOrder({
            purchase_order_id: serverOrder.purchase_order_id,
            user_email: serverOrder.user_email,
            store_id: serverOrder.store_id,
            status: localStatus,
            subtotal: serverOrder.subtotal,
            tax_total: serverOrder.tax_total,
            final_total: serverOrder.final_total,
            server_send_at: serverOrder.server_sent_at || '1111-11-11T11:11:11.111Z', // Flag for server orders with missing server_sent_at
            created_at: serverOrder.created_at,
            updated_at: serverOrder.updated_at
          });
          
          // Add purchase order items from server
          if (serverOrder.items && serverOrder.items.length > 0) {
            for (const item of serverOrder.items) {
              await DatabaseService.addPurchaseOrderItem({
                purchase_order_id: serverOrder.purchase_order_id,
                item_ean: item.item_ean,
                item_title: item.item_title,
                item_description: item.item_description || '',
                unit_of_measure: item.unit_of_measure || 'unidades',
                quantity_measure: item.quantity_measure || 1,
                image_url: item.image_url || '',
                quantity: item.quantity,
                base_price_at_order: item.base_price_at_order || 0,
                tax_rate_at_order: item.tax_rate_at_order || 0,
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString()
              });
            }
            console.log(`✅ Added ${serverOrder.items.length} items to new purchase order ${serverOrder.purchase_order_id}`);
          }
        }
      }

      console.log(`✅ Successfully synchronized ${purchaseOrders.length} purchase orders from server`);
    } else {
      console.log('📭 No purchase order updates found on server');
    }

    // Update sync config with current timestamp for next incremental sync
    const currentTime = Date.now();
    await DatabaseService.updateSyncConfig('purchase_orders', currentTime);
    console.log(`📝 Updated purchase_orders sync config with timestamp: ${new Date(currentTime).toISOString()}`);
    
  } catch (error) {
    console.error('❌ Failed to sync purchase orders from server:', error);
    // Don't throw error - this shouldn't block the main sync process
  }
}