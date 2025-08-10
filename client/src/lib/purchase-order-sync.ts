import { DatabaseService } from './indexeddb';
import { PurchaseOrder, PurchaseOrderItem } from './indexeddb';

const GRAPHQL_ENDPOINT = '/api/graphql';

interface PurchaseOrderInput {
  purchase_order_id: string;
  user_email: string;
  store_id: string;
  status: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
  items: {
    item_ean: string;
    item_title: string;
    item_description?: string;
    unit_of_measure: string;
    quantity_measure: number;
    image_url?: string;
    quantity: number;
    base_price_at_order: number;
    tax_rate_at_order: number;
  }[];
}

export async function sendPurchaseOrderToServer(
  purchaseOrder: PurchaseOrder, 
  items: PurchaseOrderItem[]
): Promise<boolean> {
  try {
    console.log(`🚀 Attempting to sync purchase order ${purchaseOrder.purchase_order_id} with server...`);
    
    // For now, disable server sync due to GraphQL server issues
    // The purchase order is already saved locally and can be accessed offline
    console.log(`⚠️ Server sync temporarily disabled - purchase order ${purchaseOrder.purchase_order_id} remains available offline`);
    return false; // Indicates server sync failed, but order is saved locally
    
    /* TODO: Re-enable when GraphQL server issues are resolved */
    // First, create the purchase order
    const createOrderMutation = `
      mutation CreatePurchaseOrder {
        createPurchaseOrder(
          purchase_order_id: "${purchaseOrder.purchase_order_id}",
          user_email: "${purchaseOrder.user_email}",
          store_id: "${purchaseOrder.store_id}",
          status: "${purchaseOrder.status}",
          subtotal: ${purchaseOrder.subtotal},
          tax_total: ${purchaseOrder.tax_total},
          final_total: ${purchaseOrder.final_total}
        ) {
          purchase_order_id
          user_email
          store_id
          status
          subtotal
          tax_total
          final_total
          created_at
          updated_at
        }
      }
    `;

    console.log('📊 Step 1: Creating purchase order via GraphQL');

    const orderResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createOrderMutation })
    });

    if (!orderResponse.ok) {
      console.error(`❌ Server error creating purchase order: HTTP ${orderResponse.status}`);
      return false;
    }

    const orderData = await orderResponse.json();

    if (orderData.errors) {
      console.error('❌ GraphQL errors creating purchase order:', orderData.errors);
      return false;
    }

    console.log('✅ Step 1 completed: Purchase order created on server');

    // Step 2: Add all purchase order items
    console.log(`📊 Step 2: Adding ${items.length} purchase order items`);
    
    for (const item of items) {
      const createItemMutation = `
        mutation {
          createPurchaseOrderItem(
            purchase_order_id: "${purchaseOrder.purchase_order_id}",
            item_ean: "${item.item_ean}",
            item_title: "${item.item_title || ''}",
            item_description: "${(item.item_description || '').replace(/"/g, '\\"')}",
            unit_of_measure: "${item.unit_of_measure || ''}",
            quantity_measure: ${item.quantity_measure || 1},
            image_url: "${item.image_url || ''}",
            quantity: ${item.quantity},
            base_price_at_order: ${item.base_price_at_order},
            tax_rate_at_order: ${item.tax_rate_at_order}
          ) {
            item_id
            purchase_order_id
            item_ean
            quantity
          }
        }
      `;

      const itemResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: createItemMutation })
      });

      if (!itemResponse.ok) {
        console.error(`❌ Server error creating item ${item.item_ean}: HTTP ${itemResponse.status}`);
        continue; // Continue with other items
      }

      const itemData = await itemResponse.json();

      if (itemData.errors) {
        console.error(`❌ GraphQL errors creating item ${item.item_ean}:`, itemData.errors);
        continue; // Continue with other items
      }

      console.log(`✅ Item ${item.item_ean} added to purchase order`);
    }

    console.log('✅ Purchase order sent successfully to server with all items');
    return true;

  } catch (error) {
    console.error('❌ Error sending purchase order to server:', error);
    return false;
  }
}

export async function syncPendingPurchaseOrders(): Promise<void> {
  try {
    console.log('🔄 Checking for pending purchase orders to sync...');
    
    // Get all purchase orders that haven't been sent to server
    const pendingOrders = await DatabaseService.getPendingPurchaseOrders();
    
    if (pendingOrders.length === 0) {
      console.log('✅ No pending purchase orders to sync');
      return;
    }

    console.log(`📦 Found ${pendingOrders.length} pending purchase orders to sync`);

    for (const order of pendingOrders) {
      try {
        // Get order items
        const items = await DatabaseService.getPurchaseOrderItems(order.purchase_order_id);
        
        // Try to send to server
        const success = await sendPurchaseOrderToServer(order, items);
        
        if (success) {
          // Update server_send_at timestamp
          await DatabaseService.updatePurchaseOrderSendStatus(order.purchase_order_id, new Date().toISOString());
          console.log(`✅ Synced purchase order ${order.purchase_order_id}`);
        } else {
          console.log(`⚠️ Failed to sync purchase order ${order.purchase_order_id}`);
        }
      } catch (error) {
        console.error(`❌ Error syncing purchase order ${order.purchase_order_id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error during purchase order sync:', error);
  }
}