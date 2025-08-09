import { DatabaseService } from './indexeddb';

const GRAPHQL_ENDPOINT = '/api/graphql'; // Use server proxy to avoid CORS
const STORE_ID = 'ES001';

// Pure IndexedDB sync - no SQL.js dependency
export async function performPureIndexedDBSync(onProgress?: (message: string, progress: number) => void): Promise<void> {
  console.log('🚀 Starting pure IndexedDB synchronization...');
  
  try {
    onProgress?.('🗑️ Limpiando datos existentes...', 10);
    // Clear existing data first
    await DatabaseService.clearAllData();
    console.log('🗑️ Cleared existing IndexedDB data');
    
    // Sync in correct order with progress updates
    onProgress?.('📊 Sincronizando impuestos (IVA)...', 20);
    await syncTaxesDirectly();
    
    onProgress?.('📦 Sincronizando productos (esto puede tardar un momento)...', 30);
    await syncProductsDirectly(onProgress);
    
    onProgress?.('🏢 Sincronizando centros de entrega...', 70);
    await syncDeliveryCentersDirectly();
    
    onProgress?.('🏪 Sincronizando tiendas...', 80);
    await syncStoresDirectly();
    
    onProgress?.('👥 Sincronizando usuarios...', 90);
    await syncUsersDirectly();
    
    onProgress?.('✅ Sincronización completada exitosamente', 100);
    console.log('✅ Pure IndexedDB synchronization completed successfully');
    
  } catch (error) {
    console.error('❌ Pure IndexedDB synchronization failed:', error);
    throw error;
  }
}

async function syncTaxesDirectly(): Promise<void> {
  console.log('🔄 Syncing taxes directly to IndexedDB...');
  
  const query = `
    query Taxes($timestamp: String, $limit: Int, $offset: Int) {
      taxes(timestamp: $timestamp, limit: $limit, offset: $offset) {
        taxes {
          code
          name
          tax_rate
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
    body: JSON.stringify({ 
      query,
      variables: { limit: 1000, offset: 0 }
    })
  });
  
  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  const taxes = data.data.taxes.taxes;
  console.log(`📊 Received ${taxes.length} taxes`);
  
  for (const tax of taxes) {
    await DatabaseService.addTax(tax);
  }
  
  console.log('✅ Taxes synced to IndexedDB');
}

async function syncProductsDirectly(onProgress?: (message: string, progress: number) => void): Promise<void> {
  console.log('🔄 Syncing products directly to IndexedDB...');
  
  let offset = 0;
  const limit = 1000;
  let totalProcessed = 0;
  let totalProducts = 0; // We'll get this from the first response
  
  while (true) {
    const query = `
      query Products($timestamp: String, $limit: Int, $offset: Int) {
        products(timestamp: $timestamp, limit: $limit, offset: $offset) {
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
      body: JSON.stringify({ 
        query, 
        variables: { limit, offset }
      })
    });
    
    const data = await response.json();
    if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    
    const products = data.data.products.products;
    totalProducts = data.data.products.total; // Get total from response
    
    console.log(`📦 Received ${products.length} products (offset: ${offset})`);
    
    if (products.length === 0) break;
    
    // Batch insert to IndexedDB - ensure is_active is handled correctly
    for (const product of products) {
      // Debug: Log first few products to see what is_active looks like
      if (totalProcessed < 5) {
        console.log(`Product ${product.ean}: is_active = ${product.is_active} (type: ${typeof product.is_active})`);
      }
      await DatabaseService.addProduct(product);
    }
    
    totalProcessed += products.length;
    console.log(`📦 Processed ${totalProcessed} products so far...`);
    
    // Update progress based on how many products we've processed
    if (totalProducts > 0 && onProgress) {
      const productProgress = Math.floor((totalProcessed / totalProducts) * 40); // Products take 40% of progress (30-70)
      onProgress(`📦 Sincronizando productos... ${totalProcessed}/${totalProducts}`, 30 + productProgress);
    }
    
    offset += limit;
    
    // Continue until we've processed all products
    if (totalProcessed >= totalProducts) break;
  }
  
  console.log(`✅ ${totalProcessed} products synced to IndexedDB`);
}

async function syncDeliveryCentersDirectly(): Promise<void> {
  console.log('🔄 Syncing delivery centers directly to IndexedDB...');
  
  const query = `
    query DeliveryCenters($timestamp: String, $limit: Int, $offset: Int) {
      deliveryCenters(timestamp: $timestamp, limit: $limit, offset: $offset) {
        total
        limit
        offset
        deliveryCenters {
          code
          name
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
    body: JSON.stringify({ 
      query,
      variables: { limit: 1000, offset: 0 }
    })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const centers = data.data.deliveryCenters.deliveryCenters;
  console.log(`🏢 Received ${centers.length} delivery centers`);
  
  for (const center of centers) {
    await DatabaseService.addDeliveryCenter(center);
  }
  
  console.log('✅ Delivery centers synced to IndexedDB');
}

async function syncStoresDirectly(): Promise<void> {
  console.log('🔄 Syncing stores directly to IndexedDB...');
  
  const query = `
    query Stores($timestamp: String, $limit: Int, $offset: Int) {
      stores(timestamp: $timestamp, limit: $limit, offset: $offset) {
        stores {
          code
          name
          responsible_email
          delivery_center_code
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
    body: JSON.stringify({ 
      query,
      variables: { limit: 1000, offset: 0 }
    })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const stores = data.data.stores.stores;
  console.log(`🏪 Received ${stores.length} stores`);
  
  for (const store of stores) {
    await DatabaseService.addStore(store);
  }
  
  console.log('✅ Stores synced to IndexedDB');
}

async function syncUsersDirectly(): Promise<void> {
  console.log('🔄 Syncing users directly to IndexedDB...');
  
  const query = `
    query Users($timestamp: String, $limit: Int, $offset: Int, $storeId: String) {
      users(timestamp: $timestamp, limit: $limit, offset: $offset, store_id: $storeId) {
        limit
        offset
        total
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
    body: JSON.stringify({ 
      query, 
      variables: { 
        storeId: STORE_ID,
        limit: 1000, 
        offset: 0 
      }
    })
  });
  
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  
  const users = data.data.users.users;
  console.log(`👥 Received ${users.length} users`);
  
  for (const user of users) {
    await DatabaseService.addUser(user);
  }
  
  console.log('✅ Users synced to IndexedDB');
}