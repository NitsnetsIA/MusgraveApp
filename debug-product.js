// Debug script to check if products have ref field in IndexedDB
const { DatabaseService } = require('./client/src/lib/indexeddb.js');

async function checkProduct() {
  try {
    // Check the specific product from the log
    const product = await DatabaseService.getProduct('8414752393352');
    console.log('Product from IndexedDB:', JSON.stringify(product, null, 2));
    
    // Check a few random products
    const allProducts = await DatabaseService.getProducts();
    console.log('First 3 products with ref fields:');
    allProducts.slice(0, 3).forEach(p => {
      console.log(`EAN: ${p.ean}, REF: ${p.ref || 'MISSING'}, Title: ${p.title.substring(0, 30)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProduct();