// Simple browser console script to check IndexedDB products
console.log('Checking products in IndexedDB for ref field...');

// Open IndexedDB
const request = indexedDB.open('MsgDatabase', 1);
request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction(['products'], 'readonly');
  const objectStore = transaction.objectStore('products');
  
  // Get first 5 products
  const getAllRequest = objectStore.getAll();
  getAllRequest.onsuccess = function(event) {
    const products = event.target.result;
    console.log('First 5 products from IndexedDB:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. EAN: ${product.ean}`);
      console.log(`   REF: ${product.ref || 'MISSING'}`);
      console.log(`   Title: ${product.title?.substring(0, 50) || 'NO TITLE'}...`);
      console.log(`   Has ref field: ${product.hasOwnProperty('ref')}`);
      console.log('---');
    });
    
    // Look for a product with a populated ref field
    const productWithRef = products.find(p => p.ref && p.ref !== '');
    if (productWithRef) {
      console.log('Found product with ref:', {
        ean: productWithRef.ean,
        ref: productWithRef.ref,
        title: productWithRef.title?.substring(0, 50)
      });
    } else {
      console.log('❌ NO PRODUCTS FOUND WITH POPULATED REF FIELD!');
    }
  };
};