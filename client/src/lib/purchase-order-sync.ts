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
    
    // Use the correct GraphQL server URL from working CURL
    const EXTERNAL_ENDPOINT = 'https://dcf77d88-2e9d-4810-ad7c-bda46c3afaed-00-19tc7g93ztbc4.riker.replit.dev:3000/';
    
    // Format the mutation exactly like the working CURL example
    const createOrderMutation = `
      mutation CreatePurchaseOrder($input: PurchaseOrderInput!) {
        createPurchaseOrder(input: $input) {
          purchase_order_id
          user_email
          store_id
          status
          subtotal
          tax_total
          final_total
          server_sent_at
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

    // Prepare variables exactly like the working CURL
    const variables = {
      input: {
        purchase_order_id: purchaseOrder.purchase_order_id,
        user_email: purchaseOrder.user_email,
        store_id: purchaseOrder.store_id,
        status: purchaseOrder.status,
        subtotal: purchaseOrder.subtotal,
        tax_total: purchaseOrder.tax_total,
        final_total: purchaseOrder.final_total,
        created_at: purchaseOrder.created_at,
        updated_at: purchaseOrder.created_at,
        items: items.map(item => ({
          item_ean: item.item_ean,
          item_title: item.item_title || '',
          item_description: item.item_description || '',
          unit_of_measure: item.unit_of_measure || 'unidades',
          quantity_measure: item.quantity_measure || 1,
          image_url: item.image_url || '',
          quantity: item.quantity,
          base_price_at_order: item.base_price_at_order,
          tax_rate_at_order: item.tax_rate_at_order,
          created_at: purchaseOrder.created_at,
          updated_at: purchaseOrder.created_at
        }))
      }
    };

    console.log('📊 Sending complete purchase order with items to GraphQL server');
    console.log('Variables:', JSON.stringify(variables, null, 2));

    const orderResponse = await fetch(EXTERNAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: createOrderMutation,
        variables 
      })
    });

    if (!orderResponse.ok) {
      console.error(`❌ Server error creating purchase order: HTTP ${orderResponse.status}`);
      return false;
    }

    const orderData = await orderResponse.json();

    if (orderData.errors) {
      console.error('❌ GraphQL errors creating purchase order:', orderData.errors);
      
      // Check if error is due to duplicate key (order already exists on server)
      const isDuplicateError = orderData.errors.some((error: any) => 
        error.message && error.message.includes('duplicate key value violates unique constraint')
      );
      
      if (isDuplicateError) {
        console.log(`⚠️ Purchase order ${purchaseOrder.purchase_order_id} already exists on server, marking as sent`);
        
        // Mark as sent since it already exists on server
        try {
          await DatabaseService.updatePurchaseOrderSendStatus(purchaseOrder.purchase_order_id, new Date().toISOString());
          console.log('✅ Marked existing purchase order as sent');
          return true; // Consider this a success since order exists on server
        } catch (updateError) {
          console.error('Error updating send status for existing order:', updateError);
          return false;
        }
      }
      
      return false;
    }

    if (orderData.data && orderData.data.createPurchaseOrder) {
      console.log('✅ Purchase order with all items sent successfully to server!');
      console.log('Server response:', orderData.data.createPurchaseOrder);
      
      // Update server_sent_at timestamp in local database
      try {
        const { UnifiedDatabaseService } = await import('@/lib/database-service');
        await UnifiedDatabaseService.updatePurchaseOrderServerSentAt(
          purchaseOrder.purchase_order_id, 
          new Date().toISOString()
        );
        console.log('✅ Updated server_sent_at timestamp locally');
      } catch (updateError) {
        console.error('Error updating server_sent_at:', updateError);
      }
      
      return true;
    } else {
      console.error('❌ Unexpected response format:', orderData);
      return false;
    }

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
    
    // Filter out orders that might already be on server (to avoid duplicate errors)
    const ordersToSync = [];
    for (const order of pendingOrders) {
      // Check if this order was recently imported from server (has created_at very close to import time)
      const orderAge = Date.now() - new Date(order.created_at).getTime();
      const isRecentlyImported = orderAge < 5 * 60 * 1000; // 5 minutes
      
      if (isRecentlyImported && !order.server_send_at) {
        console.log(`⏭️ Skipping recently imported order ${order.purchase_order_id} - likely already on server`);
        // Mark it as sent to avoid future sync attempts
        await DatabaseService.updatePurchaseOrderSendStatus(order.purchase_order_id, new Date().toISOString());
      } else {
        ordersToSync.push(order);
      }
    }
    
    if (ordersToSync.length === 0) {
      console.log('✅ No orders need to be sent to server (all were recently imported)');
      return;
    }

    console.log(`📤 Syncing ${ordersToSync.length} genuine pending purchase orders`);

    for (const order of ordersToSync) {
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