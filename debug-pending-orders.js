// Debug script to check pending purchase orders
import { DatabaseService } from './client/src/lib/indexeddb.js';

async function debugPendingOrders() {
  try {
    console.log('=== DEBUGGING PENDING PURCHASE ORDERS ===');
    
    // Check all purchase orders
    console.log('\n1. Getting all purchase orders...');
    const allOrders = await DatabaseService.db.purchase_orders.toArray();
    console.log(`Found ${allOrders.length} total purchase orders:`);
    
    allOrders.forEach((order, index) => {
      console.log(`  Order ${index + 1}:`, {
        id: order.purchase_order_id,
        status: order.status,
        server_send_at: order.server_send_at,
        created_at: order.created_at,
        user_email: order.user_email
      });
    });
    
    // Check pending orders specifically
    console.log('\n2. Getting pending purchase orders...');
    const pendingOrders = await DatabaseService.getPendingPurchaseOrders();
    console.log(`Found ${pendingOrders.length} pending purchase orders:`);
    
    pendingOrders.forEach((order, index) => {
      console.log(`  Pending Order ${index + 1}:`, {
        id: order.purchase_order_id,
        status: order.status,
        server_send_at: order.server_send_at,
        created_at: order.created_at
      });
    });
    
    // Check for items
    console.log('\n3. Checking purchase order items...');
    for (const order of allOrders) {
      const items = await DatabaseService.getPurchaseOrderItems(order.purchase_order_id);
      console.log(`  Order ${order.purchase_order_id} has ${items.length} items`);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugPendingOrders();