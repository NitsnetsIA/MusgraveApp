// Script to check product count in local database
async function checkProducts() {
  try {
    // Import the database functions
    const { initDatabase, query } = await import('./client/src/lib/database.js');
    
    // Initialize database
    await initDatabase();
    
    // Count products in local database
    const result = query('SELECT COUNT(*) as count FROM products');
    console.log('Local products count:', result[0]?.count || 0);
    
    // Get sample of products
    const sample = query('SELECT ean, title FROM products LIMIT 10');
    console.log('Sample products:', sample);
    
  } catch (error) {
    console.error('Error checking products:', error);
  }
}

checkProducts();