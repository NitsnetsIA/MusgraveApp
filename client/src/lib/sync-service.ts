import { query } from './database';

// Types for sync responses
interface SyncEntity {
  entity_name: string;
  last_updated: string;
  total_records: number;
}

interface SyncInfo {
  entities: SyncEntity[];
  generated_at: string;
}

interface SyncResponse {
  data: {
    sync_info: SyncInfo;
  };
}

interface EntityToSync {
  entity_name: string;
  needs_sync: boolean;
  last_local_request: number | null;
  server_last_updated: string;
  total_records: number;
}

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

// Types for login response
interface LoginUser {
  email: string;
  store_id: string;
  name: string;
  password_hash: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

interface LoginResponse {
  data: {
    loginUser: LoginUser;
  };
}

/**
 * Login user against GraphQL server
 */
export async function loginUserOnline(email: string, password: string): Promise<{ success: boolean; user: { email: string; store_id: string; name: string; is_active: boolean; } | null; message: string }> {
  return new Promise(async (resolve) => {
    try {
      const mutation = `
        mutation LoginUser($input: LoginInput!) {
          loginUser(input: $input) {
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
      `;

      console.log('Attempting online login for:', email);
      const requestStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Login request taking too long, aborting after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: { input: { email, password } }
        }),
        signal: controller.signal
      }).catch(error => {
        clearTimeout(timeoutId);
        console.error('Login fetch failed:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        return null;
      });

      clearTimeout(timeoutId);
      const requestTime = Date.now() - requestStart;
      console.log(`Login request completed in ${requestTime}ms`);

      if (!response || !response.ok) {
        console.error('Login request failed with status:', response?.status);
        resolve({ success: false, user: null, message: 'Network error during login' });
        return;
      }

      const data: LoginResponse = await response.json();
      console.log('Login response received:', data);

      if (data.data?.loginUser) {
        // Convert the direct user data to the expected format
        resolve({ 
          success: true, 
          user: {
            email: data.data.loginUser.email,
            store_id: data.data.loginUser.store_id,
            name: data.data.loginUser.name,
            is_active: data.data.loginUser.is_active
          }, 
          message: 'Login successful' 
        });
      } else {
        resolve({ success: false, user: null, message: 'Invalid response format' });
      }

    } catch (error) {
      console.error('Error during online login:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      resolve({ success: false, user: null, message: 'Login failed due to network error' });
    }
  });
}

/**
 * Get sync information from the server, optionally filtered by store
 */
export async function getSyncInfo(storeId?: string): Promise<SyncInfo | null> {
  // Wrap entire function in try-catch to prevent any unhandled rejections
  return new Promise(async (resolve) => {
    try {
      // WORKAROUND: Server has a bug with store_id parameter, so we always request without it
      // and filter the results locally if needed
      const query_text = `
        query ExampleQuery {
          sync_info {
            entities {
              entity_name
              last_updated
              total_records
            }
            generated_at
          }
        }
      `;

      console.log('🔧 getSyncInfo() Debug Info:');
      console.log('- storeId (ignored due to server bug):', storeId);
      console.log('- query_text:', query_text);
      console.log('- endpoint:', GRAPHQL_ENDPOINT);

      // Add timeout to avoid long waits and measure time
      console.log('Making GraphQL request to server...');
      const requestStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('GraphQL request taking too long, aborting after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query_text
        }),
        signal: controller.signal
      }).catch(error => {
        clearTimeout(timeoutId);
        console.error('Fetch failed:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      });

      clearTimeout(timeoutId);
    const requestTime = Date.now() - requestStart;
    console.log(`GraphQL request completed in ${requestTime}ms`);

    if (!response.ok) {
      console.error('❌ HTTP Error Response:');
      console.error('- Status:', response.status);
      console.error('- Status Text:', response.statusText);
      const errorText = await response.text();
      console.error('- Response Body:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data: SyncResponse = await response.json();
    console.log('📥 Raw GraphQL Response:', JSON.stringify(data, null, 2));
    
    if (data.data?.sync_info) {
      console.log('Sync info received:', data.data.sync_info);
      resolve(data.data.sync_info);
      return;
    }
    
    resolve(null);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Sync info request timed out after 30 seconds');
      } else {
        console.error('Error fetching sync info:', error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
      resolve(null);
    }
  });
}

/**
 * Get local sync configuration for an entity
 */
export function getLocalSyncConfig(entityName: string): { last_request_timestamp: number | null, last_updated_timestamp: number | null } {
  try {
    const results = query(`SELECT last_request_timestamp, last_updated_timestamp FROM sync_config WHERE entity_name = '${entityName}'`);
    
    if (results.length > 0) {
      return {
        last_request_timestamp: results[0].last_request_timestamp || null,
        last_updated_timestamp: results[0].last_updated_timestamp || null
      };
    }
    
    return {
      last_request_timestamp: null,
      last_updated_timestamp: null
    };
  } catch (error) {
    console.error(`Error getting local sync config for ${entityName}:`, error);
    return {
      last_request_timestamp: null,
      last_updated_timestamp: null
    };
  }
}

/**
 * Update local sync configuration for an entity
 */
export function updateLocalSyncConfig(entityName: string, lastRequestTimestamp: number, lastUpdatedTimestamp?: number): void {
  try {
    // First try to update existing record
    const updateQuery = `UPDATE sync_config SET last_request_timestamp = ${lastRequestTimestamp}${lastUpdatedTimestamp ? `, last_updated_timestamp = ${lastUpdatedTimestamp}` : ''} WHERE entity_name = '${entityName}'`;
    
    query(updateQuery);
    
    // Check if the update affected any rows by checking if the record exists
    const checkResult = query(`SELECT entity_name FROM sync_config WHERE entity_name = '${entityName}'`);
    
    if (checkResult.length === 0) {
      // If no record exists, insert a new one
      const insertQuery = `INSERT INTO sync_config (entity_name, last_request_timestamp${lastUpdatedTimestamp ? ', last_updated_timestamp' : ''}) VALUES ('${entityName}', ${lastRequestTimestamp}${lastUpdatedTimestamp ? `, ${lastUpdatedTimestamp}` : ''})`;
      query(insertQuery);
    }
    
    console.log(`Updated sync config for ${entityName}: last_request=${lastRequestTimestamp}${lastUpdatedTimestamp ? `, last_updated=${lastUpdatedTimestamp}` : ''}`);
  } catch (error) {
    console.error(`Error updating sync config for ${entityName}:`, error);
  }
}

/**
 * Convert ISO date string to timestamp
 */
function isoToTimestamp(isoString: string): number {
  return new Date(isoString).getTime();
}

/**
 * Determine which entities need synchronization
 * Currently only handles 'products' and 'taxes' entities
 */
export async function determineEntitiesToSync(storeId?: string): Promise<EntityToSync[]> {
  console.log('🔍 Determining entities to sync with store_id:', storeId);
  const syncInfo = await getSyncInfo(storeId);
  
  if (!syncInfo) {
    console.log('❌ Could not fetch sync info from server, forcing sync of all entities');
    // If we can't get server info, force sync of core entities
    return [
      {
        entity_name: 'taxes',
        needs_sync: true,
        last_local_request: null,
        server_last_updated: new Date().toISOString(),
        total_records: 0
      },
      {
        entity_name: 'products', 
        needs_sync: true,
        last_local_request: null,
        server_last_updated: new Date().toISOString(),
        total_records: 0
      }
    ];
  }
  
  console.log('✅ Sync info received from server:', JSON.stringify(syncInfo, null, 2));
  const entitiesToCheck = ['products', 'taxes'];
  const entitiesToSync: EntityToSync[] = [];
  
  for (const entityName of entitiesToCheck) {
    const serverEntity = syncInfo.entities.find(e => e.entity_name === entityName);
    
    if (!serverEntity) {
      console.log(`Entity ${entityName} not found on server, skipping`);
      continue;
    }
    
    const localConfig = getLocalSyncConfig(entityName);
    const serverLastUpdated = isoToTimestamp(serverEntity.last_updated);
    
    let needsSync = false;
    
    if (localConfig.last_request_timestamp === null) {
      // Never synced before
      needsSync = true;
      console.log(`Entity ${entityName} never synced before - needs sync`);
    } else {
      // Check if server has updates since our last request
      if (serverLastUpdated > localConfig.last_request_timestamp) {
        needsSync = true;
        console.log(`Entity ${entityName} has server updates since last sync - needs sync`);
        console.log(`Server last updated: ${new Date(serverLastUpdated).toISOString()}`);
        console.log(`Local last request: ${new Date(localConfig.last_request_timestamp).toISOString()}`);
      } else {
        console.log(`Entity ${entityName} is up to date - no sync needed`);
      }
    }
    
    entitiesToSync.push({
      entity_name: entityName,
      needs_sync: needsSync,
      last_local_request: localConfig.last_request_timestamp,
      server_last_updated: serverEntity.last_updated,
      total_records: serverEntity.total_records
    });
  }
  
  return entitiesToSync;
}

/**
 * Perform synchronization check and determine what needs to be synced
 * This function should be called during login
 */
export async function checkSynchronizationNeeds(storeId?: string): Promise<EntityToSync[]> {
  console.log('Checking synchronization needs...');
  const startTime = Date.now();
  
  try {
    const entitiesToSync = await determineEntitiesToSync(storeId);
    const elapsedTime = Date.now() - startTime;
    console.log(`Sync check completed in ${elapsedTime}ms`);
    
    const entitiesToUpdate = entitiesToSync.filter(entity => entity.needs_sync);
    
    if (entitiesToUpdate.length > 0) {
      console.log('Entities that need synchronization:');
      entitiesToUpdate.forEach(entity => {
        console.log(`- ${entity.entity_name}: ${entity.total_records} records, last updated: ${entity.server_last_updated}`);
      });
    } else {
      console.log('All entities are up to date - no synchronization needed');
    }
    
    return entitiesToSync;
  } catch (error) {
    console.error('Error checking synchronization needs:', error);
    return [];
  }
}

/**
 * Get the timestamp for the last request of an entity (for GraphQL queries)
 * Returns null if never synced before, or the timestamp if previously synced
 */
export function getLastRequestTimestamp(entityName: string): number | null {
  const config = getLocalSyncConfig(entityName);
  return config.last_request_timestamp;
}

/**
 * Mark a sync request as completed for an entity
 */
export function markSyncCompleted(entityName: string, serverLastUpdated: string): void {
  const now = Date.now();
  const serverTimestamp = isoToTimestamp(serverLastUpdated);
  
  updateLocalSyncConfig(entityName, now, serverTimestamp);
  console.log(`✅ Sync completed for ${entityName}: last_request=${now}, server_updated=${serverTimestamp}`);
}

/**
 * Sync users from server using GraphQL with pagination
 */
export async function syncUsers(onProgress: (message: string, progress: number) => void, storeId?: string): Promise<boolean> {
  try {
    console.log('🔄 Starting users synchronization...');
    onProgress('Sincronizando Usuarios', 0);
    
    const lastRequestTimestamp = getLastRequestTimestamp('users');
    const timestampParam = lastRequestTimestamp ? new Date(lastRequestTimestamp).toISOString() : null;
    
    console.log(`Syncing users since: ${timestampParam || 'beginning of time'}`);
    
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
    
    let offset = 0;
    const limit = 1000;
    let totalProcessed = 0;
    let totalRecords = 0;
    let allUsers: any[] = [];
    
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
            offset,
            storeId
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
      
      // Update progress
      const progressPercent = totalRecords > 0 ? (totalProcessed / totalRecords) * 100 : 100;
      onProgress(`Sincronizando Usuarios (${totalProcessed}/${totalRecords})`, progressPercent);
      
      console.log(`Received ${users.length} users, total processed: ${totalProcessed}/${totalRecords}`);
      
      // Check if we've got all records
      if (users.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }
    
    // Update database with all users
    console.log(`Updating database with ${allUsers.length} users...`);
    
    const { execute } = await import('./database');
    
    // Clear existing users from this store and insert new ones
    if (storeId) {
      execute('DELETE FROM users WHERE store_id = ?', [storeId]);
    } else {
      execute('DELETE FROM users');
    }
    
    for (const user of allUsers) {
      execute(`
        INSERT INTO users (email, store_id, name, password_hash, is_active) 
        VALUES (?, ?, ?, ?, ?)
      `, [user.email, user.store_id, user.name || '', user.password_hash, user.is_active ? 1 : 0]);
    }
    
    console.log(`✅ Successfully synced ${allUsers.length} users`);
    
    // Update sync info
    const serverInfo = await checkSynchronizationNeeds(storeId);
    const usersInfo = serverInfo.find((entity: any) => entity.entity_name === 'users');
    if (usersInfo) {
      markSyncCompleted('users', usersInfo.server_last_updated);
    }
    
    onProgress('Usuarios sincronizados correctamente', 100);
    return true;
  } catch (error) {
    console.error('❌ Error syncing users:', error);
    onProgress('Error sincronizando usuarios', 0);
    return false;
  }
}

/**
 * Sync taxes from server using GraphQL with pagination
 */
export async function syncTaxes(onProgress: (message: string, progress: number) => void, storeId?: string): Promise<boolean> {
  try {
    console.log('🔄 Starting taxes synchronization...');
    onProgress('Sincronizando Impuestos', 0);
    
    const lastRequestTimestamp = getLastRequestTimestamp('taxes');
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
    
    let offset = 0;
    const limit = 1000;
    let totalProcessed = 0;
    let totalRecords = 0;
    let allTaxes: any[] = [];
    
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
      
      // Update progress
      const progressPercent = totalRecords > 0 ? (totalProcessed / totalRecords) * 100 : 100;
      onProgress(`Sincronizando Impuestos (${totalProcessed}/${totalRecords})`, progressPercent);
      
      console.log(`Received ${taxes.length} taxes, total processed: ${totalProcessed}/${totalRecords}`);
      
      // Check if we've got all records
      if (taxes.length < limit || totalProcessed >= totalRecords) {
        break;
      }
      
      offset += limit;
    }
    
    // Update database with all taxes
    console.log(`Updating database with ${allTaxes.length} taxes...`);
    
    const { query: dbQuery } = await import('./database');
    
    // Clear existing taxes and insert new ones (slave mode - server is master)
    dbQuery('DELETE FROM taxes');
    
    for (const tax of allTaxes) {
      const insertQuery = `
        INSERT INTO taxes (code, name, tax_rate, created_at, updated_at) 
        VALUES ('${tax.code}', '${tax.name.replace(/'/g, "''")}', ${tax.tax_rate}, '${tax.created_at}', '${tax.updated_at}')
      `;
      dbQuery(insertQuery);
    }
    
    console.log(`✅ Successfully synced ${allTaxes.length} taxes`);
    
    // Update sync timestamp only if everything succeeded
    markSyncCompleted('taxes', new Date().toISOString());
    
    onProgress('Impuestos sincronizados', 100);
    return true;
    
  } catch (error) {
    console.error('❌ Error syncing taxes:', error);
    onProgress('Error sincronizando impuestos', 0);
    return false;
  }
}

/**
 * Sync products from server using GraphQL with pagination
 */
export async function syncProducts(onProgress: (message: string, progress: number) => void, storeId?: string): Promise<boolean> {
  try {
    console.log('🔄 Starting products synchronization...');
    onProgress('Sincronizando Productos', 0);
    
    const lastRequestTimestamp = getLastRequestTimestamp('products');
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
    
    let offset = 0;
    const limit = 1000;
    let totalProcessed = 0;
    let totalRecords = 0;
    let allProducts: any[] = [];
    
    // Fetch all pages with retry logic
    while (true) {
      console.log(`Fetching products page: offset=${offset}, limit=${limit}`);
      
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
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
          
          // Update progress with detailed info
          const progressPercent = totalRecords > 0 ? (totalProcessed / totalRecords) * 90 : 90; // Leave 10% for DB operations
          onProgress(`Sincronizando Productos (${totalProcessed}/${totalRecords})`, progressPercent);
          
          console.log(`Received ${products.length} products, total processed: ${totalProcessed}/${totalRecords}`);
          
          success = true;
          
          // Continue only if we got a full page and haven't reached the total
          if (products.length === 0 || totalProcessed >= totalRecords) {
            break;
          }
          
        } catch (error) {
          retryCount++;
          console.error(`Error fetching page (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Wait longer before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }
      
      // Log current pagination status
      console.log(`Pagination status: totalProcessed=${totalProcessed}, totalRecords=${totalRecords}, offset=${offset}, limit=${limit}`);
      
      // If we got all records, break the main loop
      if (totalProcessed >= totalRecords) {
        console.log(`All records fetched. Breaking pagination loop.`);
        break;
      }
      
      offset += limit;
      console.log(`Moving to next page: offset=${offset}`);
      
      // Small delay between successful requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Update database with all products
    console.log(`Updating database with ${allProducts.length} products...`);
    onProgress(`Actualizando base de datos (${allProducts.length} productos)`, 95);
    
    const { query: dbQuery, saveDatabase } = await import('./database');
    
    // Clear existing products and insert new ones (slave mode - server is master)
    dbQuery('DELETE FROM products');
    
    // Insert products in batches for better performance
    const batchSize = 100;
    let insertedCount = 0;
    
    console.log(`Starting batch insertion of ${allProducts.length} products...`);
    
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize);
      const batchNum = Math.ceil((i + batchSize) / batchSize);
      
      console.log(`Processing batch ${batchNum}: products ${i + 1} to ${Math.min(i + batchSize, allProducts.length)}`);
      
      // Build multi-insert query for better performance
      let insertSQL = `
        INSERT INTO products (
          ean, ref, title, description, base_price, tax_code, 
          unit_of_measure, quantity_measure, image_url, is_active, 
          created_at, updated_at
        ) VALUES 
      `;
      
      const values = batch.map(product => {
        const isActive = product.is_active ? 1 : 0;
        // More robust escaping for all text fields
        const safeTitle = product.title ? product.title.replace(/'/g, "''").replace(/\\/g, "\\\\") : '';
        const safeDescription = product.description ? product.description.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
        const safeRef = product.ref ? product.ref.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
        const safeImageUrl = product.image_url ? product.image_url.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
        
        return `(
          '${product.ean}', 
          ${safeRef ? `'${safeRef}'` : 'NULL'}, 
          '${safeTitle}', 
          ${safeDescription ? `'${safeDescription}'` : 'NULL'},
          ${product.base_price}, 
          '${product.tax_code}', 
          '${product.unit_of_measure}', 
          ${product.quantity_measure}, 
          ${safeImageUrl ? `'${safeImageUrl}'` : 'NULL'}, 
          ${isActive},
          '${product.created_at}', 
          '${product.updated_at}'
        )`;
      }).join(', ');
      
      insertSQL += values;
      
      try {
        dbQuery(insertSQL);
        insertedCount += batch.length;
        console.log(`Inserted batch ${Math.ceil((i + batchSize) / batchSize)} - ${insertedCount}/${allProducts.length} products`);
        
        // Update progress during batch insertion
        const insertProgress = (insertedCount / allProducts.length) * 5; // 5% of total progress for DB insertion
        onProgress(`Insertando productos (${insertedCount}/${allProducts.length})`, 95 + insertProgress);
        
      } catch (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error);
        console.error('Failed SQL:', insertSQL.substring(0, 500) + '...');
        console.error('Problematic products in this batch:', batch.slice(0, 3).map(p => ({ ean: p.ean, title: p.title })));
        
        // Try inserting products individually to continue with sync
        console.log('Attempting individual inserts for this batch...');
        for (const product of batch) {
          try {
            const isActive = product.is_active ? 1 : 0;
            const safeTitle = product.title ? product.title.replace(/'/g, "''").replace(/\\/g, "\\\\") : '';
            const safeDescription = product.description ? product.description.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
            const safeRef = product.ref ? product.ref.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
            const safeImageUrl = product.image_url ? product.image_url.replace(/'/g, "''").replace(/\\/g, "\\\\") : null;
            
            const singleInsertSQL = `
              INSERT INTO products (
                ean, ref, title, description, base_price, tax_code, 
                unit_of_measure, quantity_measure, image_url, is_active, 
                created_at, updated_at
              ) VALUES (
                '${product.ean}', 
                ${safeRef ? `'${safeRef}'` : 'NULL'}, 
                '${safeTitle}', 
                ${safeDescription ? `'${safeDescription}'` : 'NULL'},
                ${product.base_price}, 
                '${product.tax_code}', 
                '${product.unit_of_measure}', 
                ${product.quantity_measure}, 
                ${safeImageUrl ? `'${safeImageUrl}'` : 'NULL'}, 
                ${isActive},
                '${product.created_at}', 
                '${product.updated_at}'
              )
            `;
            
            dbQuery(singleInsertSQL);
            insertedCount++;
            
          } catch (individualError) {
            console.error(`Failed to insert individual product ${product.ean}:`, individualError);
            // Continue with the rest - don't break the entire sync
          }
        }
        
        console.log(`Completed individual inserts, total inserted: ${insertedCount}/${allProducts.length}`);
        
        // Update progress after individual inserts
        const insertProgress = (insertedCount / allProducts.length) * 5;
        onProgress(`Insertando productos (${insertedCount}/${allProducts.length})`, 95 + insertProgress);
      }
    }
    
    // Save database after all inserts
    console.log('Saving database to localStorage...');
    saveDatabase();
    
    console.log(`✅ Successfully synced ${insertedCount}/${allProducts.length} products`);
    
    // Only mark as completed if we got ALL products
    if (insertedCount === allProducts.length) {
      // Update sync timestamp with current time (when we completed the sync)
      const now = new Date().toISOString();
      markSyncCompleted('products', now);
      console.log(`Sync completed successfully at: ${now}`);
    } else {
      console.warn(`Partial sync: ${insertedCount}/${allProducts.length} products synced`);
      // Don't update timestamp - force resync next time
    }
    
    // Database already saved after batch inserts
    
    if (insertedCount === allProducts.length) {
      onProgress('Productos sincronizados', 100);
      return true;
    } else {
      onProgress(`Sincronización parcial (${insertedCount}/${allProducts.length})`, 100);
      return false; // Force retry next time
    }
    
  } catch (error) {
    console.error('❌ Error syncing products:', error);
    onProgress('Error sincronizando productos', 0);
    return false;
  }
}

/**
 * Test function to manually trigger sync check (for development)
 */
export async function testSyncCheck(): Promise<void> {
  console.log('🧪 Testing sync check...');
  const results = await checkSynchronizationNeeds();
  
  console.log('📊 Sync check results:');
  results.forEach(entity => {
    const status = entity.needs_sync ? '🔄 NEEDS SYNC' : '✅ UP TO DATE';
    console.log(`${status} ${entity.entity_name}: ${entity.total_records} records`);
    if (entity.last_local_request) {
      console.log(`  Last local request: ${new Date(entity.last_local_request).toISOString()}`);
    } else {
      console.log(`  Never synced before`);
    }
    console.log(`  Server last updated: ${entity.server_last_updated}`);
  });
}