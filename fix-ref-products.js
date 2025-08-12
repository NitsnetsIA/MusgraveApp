// Direct script to fix product ref issue by forcing GraphQL sync
const GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

async function fixProductRefs() {
  console.log('🔧 Starting product ref fix...');
  
  // First, let's get a few products from GraphQL to verify they have refs
  const testQuery = `
    query {
      products(limit: 3) {
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
        }
      }
    }
  `;
  
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });
    
    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return;
    }
    
    const products = data.data.products.products;
    console.log('✅ GraphQL has products with ref field:');
    products.forEach(p => {
      console.log(`- EAN: ${p.ean}, REF: ${p.ref}, Title: ${p.title.substring(0, 40)}`);
    });
    
    // Now check what we have in IndexedDB
    console.log('\n🔍 Checking IndexedDB products...');
    
    return new Promise((resolve) => {
      const request = indexedDB.open('MsgDatabase', 1);
      request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['products'], 'readonly');
        const objectStore = transaction.objectStore('products');
        
        const getAllRequest = objectStore.getAll();
        getAllRequest.onsuccess = function(event) {
          const localProducts = event.target.result;
          console.log(`📦 IndexedDB has ${localProducts.length} products`);
          
          if (localProducts.length > 0) {
            console.log('First 3 local products:');
            localProducts.slice(0, 3).forEach(p => {
              console.log(`- EAN: ${p.ean}, REF: ${p.ref || 'MISSING'}, Title: ${p.title?.substring(0, 40)}`);
            });
            
            const withRef = localProducts.filter(p => p.ref && p.ref !== '');
            console.log(`\n📊 Local products with ref: ${withRef.length}/${localProducts.length}`);
            
            if (withRef.length === 0) {
              console.log('\n❌ PROBLEM CONFIRMED: Local products have no ref field!');
              console.log('\n🔧 SOLUTION: Clear products and force sync');
              console.log('Execute in browser console:');
              console.log(`
// Clear all products from IndexedDB
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['products'], 'readwrite');
  const objectStore = transaction.objectStore('products');
  
  objectStore.clear().then(() => {
    console.log('✅ Products cleared! Now reload page to trigger sync.');
    location.reload();
  });
};`);
              
              // Also clear sync config to force full sync
              console.log('\nOr execute this to also clear sync config:');
              console.log(`
// Clear products and sync config
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['products', 'sync_config'], 'readwrite');
  
  Promise.all([
    transaction.objectStore('products').clear(),
    transaction.objectStore('sync_config').delete('products')
  ]).then(() => {
    console.log('✅ Products and sync config cleared! Reload page.');
    location.reload();
  });
};`);
            } else {
              console.log('✅ Some local products have ref - sync is working');
            }
          }
          resolve();
        };
      };
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixProductRefs();