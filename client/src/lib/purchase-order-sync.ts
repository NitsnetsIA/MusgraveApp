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
    console.log(`🚀 Sending purchase order ${purchaseOrder.purchase_order_id} to GraphQL server...`);

    // Prepare the input for GraphQL mutation
    const input: PurchaseOrderInput = {
      purchase_order_id: purchaseOrder.purchase_order_id,
      user_email: purchaseOrder.user_email,
      store_id: purchaseOrder.store_id,
      status: purchaseOrder.status,
      subtotal: purchaseOrder.subtotal,
      tax_total: purchaseOrder.tax_total,
      final_total: purchaseOrder.final_total,
      items: items.map(item => ({
        item_ean: item.item_ean,
        item_title: item.item_title || '',
        item_description: item.item_description,
        unit_of_measure: item.unit_of_measure || '',
        quantity_measure: item.quantity_measure || 1,
        image_url: item.image_url,
        quantity: item.quantity,
        base_price_at_order: item.base_price_at_order,
        tax_rate_at_order: item.tax_rate_at_order
      }))
    };

    const mutation = `
      mutation CreatePurchaseOrder($input: PurchaseOrderInput!) {
        createPurchaseOrder(input: $input) {
          purchase_order_id
          user_email
          store_id
          status
          subtotal
          tax_total
          final_total
          created_at
          updated_at
          items {
            item_id
            purchase_order_id
            item_ean
            item_title
            item_description
            unit_of_measure
            quantity_measure
            image_url
            quantity
            base_price_at_order
            tax_rate_at_order
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input }
      })
    });

    if (!response.ok) {
      console.error(`❌ Server error: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return false;
    }

    console.log('✅ Purchase order sent successfully to server');
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