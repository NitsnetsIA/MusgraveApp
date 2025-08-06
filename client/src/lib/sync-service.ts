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

/**
 * Get sync information from the server
 */
export async function getSyncInfo(): Promise<SyncInfo | null> {
  try {
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

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query_text,
        variables: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SyncResponse = await response.json();
    
    if (data.data?.sync_info) {
      console.log('Sync info received:', data.data.sync_info);
      return data.data.sync_info;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching sync info:', error);
    return null;
  }
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
export async function determineEntitiesToSync(): Promise<EntityToSync[]> {
  const syncInfo = await getSyncInfo();
  
  if (!syncInfo) {
    console.log('Could not fetch sync info from server, skipping sync');
    return [];
  }
  
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
export async function checkSynchronizationNeeds(): Promise<EntityToSync[]> {
  console.log('Checking synchronization needs...');
  
  try {
    const entitiesToSync = await determineEntitiesToSync();
    
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
  console.log(`✅ Sync completed for ${entityName}`);
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