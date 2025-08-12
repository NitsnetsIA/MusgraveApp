// Force clear products and re-sync from GraphQL to ensure ref field
console.log('🗑️ This script will clear all products and force re-sync from GraphQL');
console.log('Execute this in browser console:');
console.log(`
// Clear products and force sync
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = async function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['products'], 'readwrite');
  const objectStore = transaction.objectStore('products');
  
  console.log('🗑️ Clearing all products...');
  await objectStore.clear();
  
  console.log('✅ Products cleared. Now force sync from app UI.');
  console.log('Go to Product Catalog and click sync button.');
};
`);

console.log('\nOr execute this to check current products in IndexedDB:');
console.log(`
// Check current products
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['products'], 'readonly');
  const objectStore = transaction.objectStore('products');
  
  const getAllRequest = objectStore.getAll();
  getAllRequest.onsuccess = function(event) {
    const products = event.target.result;
    console.log('Current products in IndexedDB:', products.length);
    
    const sampleProducts = products.slice(0, 3);
    console.log('Sample products:');
    sampleProducts.forEach(p => {
      console.log(\`- EAN: \${p.ean}, REF: \${p.ref || 'MISSING'}, Title: \${p.title}\`);
    });
    
    const productsWithRef = products.filter(p => p.ref && p.ref !== '');
    console.log(\`Products with ref: \${productsWithRef.length}/\${products.length}\`);
  };
};
`);