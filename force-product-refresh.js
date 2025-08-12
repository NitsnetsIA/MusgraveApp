// Simple script to check and force products sync if needed
const { DatabaseService: IndexedDBService } = require('./client/src/lib/indexeddb.js');

async function checkAndFixProducts() {
  try {
    console.log('🔍 Checking products in IndexedDB...');
    
    // Get sample products to check if they have ref
    const sampleProducts = await IndexedDBService.getProducts(false);
    console.log(`Found ${sampleProducts.length} products total`);
    
    if (sampleProducts.length > 0) {
      const firstProduct = sampleProducts[0];
      console.log('First product:', {
        ean: firstProduct.ean,
        ref: firstProduct.ref || 'MISSING',
        title: firstProduct.title?.substring(0, 50),
        hasRefField: firstProduct.hasOwnProperty('ref')
      });
      
      const productsWithRef = sampleProducts.filter(p => p.ref && p.ref !== '');
      console.log(`Products with populated ref: ${productsWithRef.length}/${sampleProducts.length}`);
      
      if (productsWithRef.length === 0) {
        console.log('❌ NO PRODUCTS HAVE REF FIELD - Need to force sync!');
        console.log('Execute this in browser to clear products and force sync:');
        console.log('');
        console.log('indexedDB.deleteDatabase("MsgDatabase").then(() => location.reload())');
        console.log('');
        console.log('Or clear just products:');
        console.log(`
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = function(event) {
  const db = event.target.result;
  const tx = db.transaction(['products'], 'readwrite');
  tx.objectStore('products').clear().then(() => {
    console.log('✅ Products cleared - now sync from UI');
  });
};`);
      } else {
        console.log('✅ Some products have ref field - sync is working');
      }
    } else {
      console.log('⚠️ No products found - sync needed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// This would need to be run in browser context, not node
console.log('This script needs to run in browser context. Copy the logic to browser console.');
console.log('Or use the sync logic already built into the app.');