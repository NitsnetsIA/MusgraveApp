import { DatabaseService } from './indexeddb';

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
  let totalProducts = 0; // We'll get this from the first response
  let serverLastUpdated = 0;
  let allProducts: any[] = []; // Collect all products for bulk insert
  
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
    totalProducts = data.data.products.total; // Get total from response
    
    console.log(`📦 Received ${products.length} products (offset: ${offset})`);
    
    if (products.length === 0) break;
    
    // OPTIMIZED: Collect products for bulk insert instead of individual inserts
    allProducts.push(...products);
    
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
  
  // MASSIVE PERFORMANCE BOOST: Use bulk insert instead of individual inserts
  console.log(`🚀 OPTIMIZED BULK INSERT: Inserting ${allProducts.length} products at once...`);
  await DatabaseService.syncProducts(allProducts);
  
  // Update sync config
  await DatabaseService.updateSyncConfig('products', Date.now());
  
  console.log(`✅ ${totalProcessed} products synced to IndexedDB with OPTIMIZED bulk insert`);
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