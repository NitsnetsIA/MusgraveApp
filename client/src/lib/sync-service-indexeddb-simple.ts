import { DatabaseService } from './indexeddb';

// Sync entities in correct order
const SYNC_ORDER = ['taxes', 'products', 'deliveryCenters', 'stores', 'users'];

export async function performFullSync(): Promise<void> {
  console.log('🚀 Starting full synchronization with IndexedDB...');
  
  try {
    // Use the working sync service to get data
    const { checkSynchronizationNeeds, syncTaxes, syncProducts, syncDeliveryCenters, syncStores, syncUsers } = await import('./sync-service');
    
    // Check what needs sync with store ES001
    console.log('🔍 Checking sync status...');
    const syncResults = await checkSynchronizationNeeds('ES001');
    console.log('✅ Sync check completed:', syncResults);
    
    // Filter entities that need sync in correct order
    const entitiesToSync = SYNC_ORDER.filter(entity => 
      syncResults.some(result => 
        (result.entity_name === entity || 
         (result.entity_name === 'delivery_centers' && entity === 'deliveryCenters') ||
         (result.entity_name === 'deliveryCenters' && entity === 'deliveryCenters')) && 
        result.needs_sync
      )
    );

    console.log('📋 Entities to sync:', entitiesToSync);

    if (entitiesToSync.length === 0) {
      console.log('✅ All entities are up to date');
      return;
    }

    // Sync each entity
    for (const entityName of entitiesToSync) {
      console.log(`🔄 Syncing ${entityName}...`);
      
      try {
        let syncSuccess = false;
        
        // Get data from original sync service
        if (entityName === 'taxes') {
          syncSuccess = await syncTaxes(() => {}, 'ES001');
        } else if (entityName === 'products') {
          syncSuccess = await syncProducts(() => {}, 'ES001');
        } else if (entityName === 'deliveryCenters') {
          syncSuccess = await syncDeliveryCenters(() => {}, 'ES001');
        } else if (entityName === 'stores') {
          syncSuccess = await syncStores(() => {}, 'ES001');
        } else if (entityName === 'users') {
          syncSuccess = await syncUsers(() => {}, 'ES001');
        }
        
        if (syncSuccess) {
          console.log(`✅ ${entityName} synced successfully`);
          
          // Now migrate data from SQL.js to IndexedDB
          await migrateEntityToIndexedDB(entityName);
        } else {
          console.warn(`⚠️ Failed to sync ${entityName}`);
        }
      } catch (error) {
        console.error(`❌ Error syncing ${entityName}:`, error);
        // Continue with other entities
      }
    }

    console.log('✅ Full synchronization completed');
    
  } catch (error) {
    console.error('❌ Full synchronization failed:', error);
    throw error;
  }
}

// Migrate data from SQL.js to IndexedDB
async function migrateEntityToIndexedDB(entityName: string): Promise<void> {
  console.log(`📥 Migrating ${entityName} to IndexedDB...`);
  
  try {
    const { query } = await import('./database');
    
    if (entityName === 'taxes') {
      const taxes = await query('SELECT * FROM taxes');
      for (const tax of taxes) {
        await DatabaseService.addTax(tax);
      }
    } else if (entityName === 'products') {
      const products = await query('SELECT * FROM products');
      console.log(`📦 Migrating ${products.length} products...`);
      
      // Batch insert for better performance
      const batchSize = 100;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        for (const product of batch) {
          await DatabaseService.addProduct(product);
        }
        console.log(`📦 Migrated ${Math.min(i + batchSize, products.length)}/${products.length} products...`);
      }
    } else if (entityName === 'deliveryCenters') {
      const centers = await query('SELECT * FROM delivery_centers');
      for (const center of centers) {
        await DatabaseService.addDeliveryCenter(center);
      }
    } else if (entityName === 'stores') {
      const stores = await query('SELECT * FROM stores');
      for (const store of stores) {
        await DatabaseService.addStore(store);
      }
    } else if (entityName === 'users') {
      const users = await query('SELECT * FROM users');
      for (const user of users) {
        await DatabaseService.addUser(user);
      }
    }
    
    console.log(`✅ ${entityName} migrated to IndexedDB`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${entityName}:`, error);
    throw error;
  }
}