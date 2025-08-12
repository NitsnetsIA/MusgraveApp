// Utility to force product sync with ref fields
import { DatabaseService } from '@/lib/indexeddb';

export async function forceProductSyncWithRef(): Promise<boolean> {
  try {
    console.log('🔧 Forcing product sync with ref fields...');
    
    // Clear all products to force fresh sync
    const request = indexedDB.open('MsgDatabase', 1);
    
    return new Promise((resolve) => {
      request.onsuccess = async function(event) {
        const db = event.target.result as IDBDatabase;
        
        try {
          // Clear products and sync config in a transaction
          const transaction = db.transaction(['products', 'sync_config'], 'readwrite');
          
          await Promise.all([
            transaction.objectStore('products').clear(),
            transaction.objectStore('sync_config').delete('products')
          ]);
          
          console.log('✅ Products cleared, sync config reset');
          
          // Force reload to trigger fresh sync
          window.location.reload();
          resolve(true);
          
        } catch (error) {
          console.error('Error clearing products:', error);
          resolve(false);
        }
      };
      
      request.onerror = () => {
        console.error('Error opening IndexedDB');
        resolve(false);
      };
    });
    
  } catch (error) {
    console.error('Error in forceProductSyncWithRef:', error);
    return false;
  }
}