import { DatabaseService } from './indexeddb';

const GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

// Get last sync timestamp for an entity
async function getLastSyncTimestamp(entity: string): Promise<number | null> {
  const config = await DatabaseService.getSyncConfig(entity);
  return config?.last_request || null;
}

// Update sync timestamp for an entity
async function updateSyncTimestamp(entity: string, lastRequest: number, serverUpdated: number): Promise<void> {
  await DatabaseService.setSyncConfig({
    entity,
    last_request: lastRequest,
    last_updated: serverUpdated
  });
}

// Check which entities need synchronization
export async function checkSyncStatus(): Promise<{
  syncInfo: any;
  entitiesToSync: Array<{
    entity: string;
    totalRecords: number;
    lastUpdated: string;
  }>;
}> {
  console.log('🔍 Checking sync status with GraphQL server...');
  const startTime = Date.now();

  try {
    // Get sync info from server
    const query = `
      query GetSyncInfo {
        getSyncInfo {
          entities {
            entity_name
            last_updated
            total_records
          }
          generated_at
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const syncInfo = data.data.getSyncInfo;
    console.log('✅ Sync info received from server:', JSON.stringify(syncInfo, null, 2));

    // Check each entity
    const entitiesToSync = [];
    
    for (const entityInfo of syncInfo.entities) {
      const entityName = entityInfo.entity_name;
      const serverUpdated = new Date(entityInfo.last_updated).getTime();
      const lastSyncTime = await getLastSyncTimestamp(entityName);
      
      if (!lastSyncTime || lastSyncTime < serverUpdated) {
        console.log(`Entity ${entityName} needs sync - server updated: ${entityInfo.last_updated}, last sync: ${lastSyncTime ? new Date(lastSyncTime).toISOString() : 'never'}`);
        entitiesToSync.push({
          entity: entityName,
          totalRecords: entityInfo.total_records,
          lastUpdated: entityInfo.last_updated
        });
      } else {
        console.log(`Entity ${entityName} is up to date - no sync needed`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Sync check completed in ${duration}ms`);

    if (entitiesToSync.length > 0) {
      console.log('Entities that need synchronization:');
      entitiesToSync.forEach(entity => {
        console.log(`- ${entity.entity}: ${entity.totalRecords} records, last updated: ${entity.lastUpdated}`);
      });
    }

    return { syncInfo, entitiesToSync };

  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    throw error;
  }
}

// Sync taxes
export async function syncTaxes(): Promise<void> {
  console.log('🔄 Starting taxes synchronization...');
  
  const lastRequestTimestamp = await getLastSyncTimestamp('taxes');
  const requestTime = Date.now();
  const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
  
  console.log(`Syncing taxes since: ${timestampParam || 'beginning of time'}`);
  
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

  try {
    const limit = 1000;
    let offset = 0;
    let totalRecords = 0;
    let totalProcessed = 0;
    const allTaxes = [];

    // Fetch all pages
    while (true) {
      console.log(`Fetching taxes page: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            timestamp: timestampParam,
            limit,
            offset
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const taxesPage = data.data?.taxes;
      if (!taxesPage) {
        throw new Error('Invalid response structure');
      }
      
      totalRecords = taxesPage.total;
      const taxes = taxesPage.taxes || [];
      
      allTaxes.push(...taxes);
      totalProcessed += taxes.length;
      
      if (taxes.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }

    console.log(`Fetched ${allTaxes.length} taxes from GraphQL`);

    // Update database with new data
    console.log(`Updating database with ${allTaxes.length} taxes...`);
    await DatabaseService.syncTaxes(allTaxes);

    // Update sync timestamp
    const serverUpdatedTime = Date.now(); // Use current time as approximation
    await updateSyncTimestamp('taxes', requestTime, serverUpdatedTime);
    console.log(`Updated sync config for taxes: last_request=${requestTime}, last_updated=${serverUpdatedTime}`);
    
    console.log(`✅ Sync completed for taxes: last_request=${requestTime}, server_updated=${serverUpdatedTime}`);

  } catch (error) {
    console.error('❌ Error syncing taxes:', error);
    throw error;
  }
}

// Sync products
export async function syncProducts(): Promise<void> {
  console.log('🔄 Starting products synchronization...');
  
  const lastRequestTimestamp = await getLastSyncTimestamp('products');
  const requestTime = Date.now();
  const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
  
  console.log(`Syncing products since: ${timestampParam || 'beginning of time'}`);
  
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

  try {
    const limit = 1000;
    let offset = 0;
    let totalRecords = 0;
    let totalProcessed = 0;
    const allProducts = [];

    // Fetch all pages
    while (true) {
      console.log(`Fetching products page: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            timestamp: timestampParam,
            limit,
            offset
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const productsPage = data.data?.products;
      if (!productsPage) {
        throw new Error('Invalid response structure');
      }
      
      totalRecords = productsPage.total;
      const products = productsPage.products || [];
      
      allProducts.push(...products);
      totalProcessed += products.length;
      
      console.log(`Fetched ${products.length} products (${totalProcessed}/${totalRecords})`);
      
      if (products.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }

    console.log(`Fetched ${allProducts.length} products from GraphQL`);

    // Update database with new data - IndexedDB handles large datasets efficiently
    console.log(`Updating database with ${allProducts.length} products...`);
    await DatabaseService.syncProducts(allProducts);

    // Update sync timestamp
    const serverUpdatedTime = Date.now();
    await updateSyncTimestamp('products', requestTime, serverUpdatedTime);
    console.log(`Updated sync config for products: last_request=${requestTime}, last_updated=${serverUpdatedTime}`);
    
    console.log(`✅ Sync completed for products: last_request=${requestTime}, server_updated=${serverUpdatedTime}`);

  } catch (error) {
    console.error('❌ Error syncing products:', error);
    throw error;
  }
}

// Sync delivery centers
export async function syncDeliveryCenters(): Promise<void> {
  console.log('🔄 Starting delivery centers synchronization...');
  
  const lastRequestTimestamp = await getLastSyncTimestamp('delivery_centers');
  const requestTime = Date.now();
  const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
  
  console.log(`Syncing delivery centers since: ${timestampParam || 'beginning of time'}`);
  
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

  try {
    const limit = 1000;
    let offset = 0;
    let totalRecords = 0;
    let totalProcessed = 0;
    const allCenters = [];

    // Fetch all pages
    while (true) {
      console.log(`Fetching delivery centers page: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            timestamp: timestampParam,
            limit,
            offset
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const centersPage = data.data?.deliveryCenters;
      if (!centersPage) {
        throw new Error('Invalid response structure');
      }
      
      totalRecords = centersPage.total;
      const centers = centersPage.deliveryCenters || [];
      
      allCenters.push(...centers);
      totalProcessed += centers.length;
      
      if (centers.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }

    console.log(`Fetched ${allCenters.length} delivery centers from GraphQL`);

    // Update database with new data
    console.log(`Updating database with ${allCenters.length} delivery centers...`);
    await DatabaseService.syncDeliveryCenters(allCenters);

    // Update sync timestamp
    const serverUpdatedTime = Date.now();
    await updateSyncTimestamp('delivery_centers', requestTime, serverUpdatedTime);
    console.log(`Updated sync config for delivery_centers: last_request=${requestTime}, last_updated=${serverUpdatedTime}`);
    
    console.log(`✅ Sync completed for delivery_centers: last_request=${requestTime}, server_updated=${serverUpdatedTime}`);

  } catch (error) {
    console.error('❌ Error syncing delivery centers:', error);
    throw error;
  }
}

// Sync stores
export async function syncStores(): Promise<void> {
  console.log('🔄 Starting stores synchronization...');
  
  const lastRequestTimestamp = await getLastSyncTimestamp('stores');
  const requestTime = Date.now();
  const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
  
  console.log(`Syncing stores since: ${timestampParam || 'beginning of time'}`);
  
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

  try {
    const limit = 1000;
    let offset = 0;
    let totalRecords = 0;
    let totalProcessed = 0;
    const allStores = [];

    // Fetch all pages
    while (true) {
      console.log(`Fetching stores page: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            timestamp: timestampParam,
            limit,
            offset
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const storesPage = data.data?.stores;
      if (!storesPage) {
        throw new Error('Invalid response structure');
      }
      
      totalRecords = storesPage.total;
      const stores = storesPage.stores || [];
      
      allStores.push(...stores);
      totalProcessed += stores.length;
      
      if (stores.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }

    console.log(`Fetched ${allStores.length} stores from GraphQL`);

    // Update database with new data
    console.log(`Updating database with ${allStores.length} stores...`);
    await DatabaseService.syncStores(allStores);

    // Update sync timestamp
    const serverUpdatedTime = Date.now();
    await updateSyncTimestamp('stores', requestTime, serverUpdatedTime);
    console.log(`Updated sync config for stores: last_request=${requestTime}, last_updated=${serverUpdatedTime}`);
    
    console.log(`✅ Sync completed for stores: last_request=${requestTime}, server_updated=${serverUpdatedTime}`);

  } catch (error) {
    console.error('❌ Error syncing stores:', error);
    throw error;
  }
}

// Sync users
export async function syncUsers(): Promise<void> {
  console.log('🔄 Starting users synchronization...');
  
  const lastRequestTimestamp = await getLastSyncTimestamp('users');
  const requestTime = Date.now();
  const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
  
  console.log(`Syncing users since: ${timestampParam || 'beginning of time'}`);
  
  const query = `
    query Users($timestamp: String, $limit: Int, $offset: Int) {
      users(timestamp: $timestamp, limit: $limit, offset: $offset) {
        users {
          email
          store_id
          name
          password_hash
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

  try {
    const limit = 1000;
    let offset = 0;
    let totalRecords = 0;
    let totalProcessed = 0;
    const allUsers = [];

    // Fetch all pages
    while (true) {
      console.log(`Fetching users page: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            timestamp: timestampParam,
            limit,
            offset
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      const usersPage = data.data?.users;
      if (!usersPage) {
        throw new Error('Invalid response structure');
      }
      
      totalRecords = usersPage.total;
      const users = usersPage.users || [];
      
      allUsers.push(...users);
      totalProcessed += users.length;
      
      if (users.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }

    console.log(`Fetched ${allUsers.length} users from GraphQL`);

    // Update database with new data
    console.log(`Updating database with ${allUsers.length} users...`);
    await DatabaseService.syncUsers(allUsers);

    // Update sync timestamp
    const serverUpdatedTime = Date.now();
    await updateSyncTimestamp('users', requestTime, serverUpdatedTime);
    console.log(`Updated sync config for users: last_request=${requestTime}, last_updated=${serverUpdatedTime}`);
    
    console.log(`✅ Sync completed for users: last_request=${requestTime}, server_updated=${serverUpdatedTime}`);

  } catch (error) {
    console.error('❌ Error syncing users:', error);
    throw error;
  }
}

// Perform full synchronization in correct order
export async function performFullSync(): Promise<void> {
  console.log('🚀 Starting full synchronization with IndexedDB...');
  const startTime = Date.now();

  try {
    // Check what needs to be synced
    const { entitiesToSync } = await checkSyncStatus();
    
    if (entitiesToSync.length === 0) {
      console.log('✅ All entities are up to date - no sync needed');
      return;
    }

    // Sync in dependency order: taxes → products → delivery_centers → stores → users
    const syncOrder = ['taxes', 'products', 'delivery_centers', 'stores', 'users'];
    
    for (const entityName of syncOrder) {
      const entityToSync = entitiesToSync.find(e => e.entity === entityName);
      if (!entityToSync) {
        console.log(`⏭️ Skipping ${entityName} - up to date`);
        continue;
      }

      console.log(`📦 Syncing ${entityName} (${entityToSync.totalRecords} records)...`);
      
      switch (entityName) {
        case 'taxes':
          await syncTaxes();
          break;
        case 'products':
          await syncProducts();
          break;
        case 'delivery_centers':
          await syncDeliveryCenters();
          break;
        case 'stores':
          await syncStores();
          break;
        case 'users':
          await syncUsers();
          break;
        default:
          console.warn(`⚠️ Unknown entity: ${entityName}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 Full synchronization completed in ${duration}ms`);
    
    // Log database statistics
    const stats = await DatabaseService.getDatabaseStats();
    console.log('📊 Database statistics after sync:', stats);

  } catch (error) {
    console.error('❌ Full synchronization failed:', error);
    throw error;
  }
}