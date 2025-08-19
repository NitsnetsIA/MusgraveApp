// Simple test to check pending purchase orders
async function testPendingOrders() {
  try {
    // Import the database service
    const { DatabaseService } = await import('./client/src/lib/database-service.ts');
    
    console.log('Testing getPendingPurchaseOrders...');
    const pending = await DatabaseService.getPendingPurchaseOrders();
    console.log(`Found ${pending.length} pending orders:`, pending);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPendingOrders();
