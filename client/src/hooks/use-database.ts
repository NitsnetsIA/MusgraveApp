import { useState, useEffect } from "react";
import { DatabaseService as IndexedDBService } from "@/lib/indexeddb";
import { UnifiedDatabaseService } from "@/lib/database-service";
// Import removed: sync-service was deleted, login is now handled by database-service
import type {
  User,
  Product,
  PurchaseOrder,
  Order,
  CartItem,
} from "@shared/schema";

// Helper functions
function generateUUID(): string {
  return "xxxx-xxxx-4xxx-yxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generatePurchaseOrderId(): string {
  const musgraveCenterCode = "MUS";
  const timestamp = Date.now().toString().slice(-8);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${musgraveCenterCode}-${timestamp}-${suffix}`;
}

function generateProcessedOrderId(): string {
  const musgraveCenterCode = "MUS";
  const timestamp = Date.now().toString().slice(-8);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${musgraveCenterCode}-${timestamp}-${suffix}`;
}

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Simple online login function
  const performOnlineLogin = async (email: string, password: string) => {
    try {
      const loginMutation = `
        mutation LoginUser($input: LoginInput!) {
          loginUser(input: $input) {
            email
            store_id
            name
            is_active
          }
        }
      `;

      const response = await fetch(
        "https://pim-grocery-ia64.replit.app/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: loginMutation,
            variables: { input: { email, password } },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data?.loginUser) {
          return {
            success: true,
            user: data.data.loginUser,
            message: "Login successful",
          };
        }
      }
      return { success: false, user: null, message: "Invalid credentials" };
    } catch (error) {
      return { success: false, user: null, message: "Network error" };
    }
  };

  useEffect(() => {
    async function init() {
      try {
        // IndexedDB initialization is automatic, just set as initialized
        setIsInitialized(true);
        console.log("IndexedDB ready for use");
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);
        setIsInitialized(true); // Allow app to start anyway
      }
    }

    init();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // User operations
  const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
      const user = await IndexedDBService.getUser(email);
      return user && user.is_active ? user : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  };

  const authenticateUser = async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      console.log("Starting authentication process for:", email);

      // First, try online authentication against GraphQL server
      console.log("Attempting online authentication...");
      const onlineResult = await performOnlineLogin(email, password);

      if (onlineResult.success && onlineResult.user) {
        console.log("Online authentication successful:", onlineResult.user);

        // Check if user exists locally, if not create/update it
        const localUser = await IndexedDBService.getUser(email);

        const userToSave = {
          email: onlineResult.user.email,
          store_id: onlineResult.user.store_id,
          name: onlineResult.user.name,
          is_active: onlineResult.user.is_active ? 1 : 0,
          password_hash: "online_verified", // Placeholder since we verified online
          created_at:
            (onlineResult.user as any).created_at || new Date().toISOString(),
          updated_at:
            (onlineResult.user as any).updated_at || new Date().toISOString(),
          last_login:
            (onlineResult.user as any).last_login || new Date().toISOString(),
        };

        if (!localUser) {
          // Create new local user from online data
          console.log("Creating new local user from online data");
          await IndexedDBService.addUser(userToSave);
        } else {
          // Update existing local user with online data
          console.log("Updating existing local user with online data");
          await IndexedDBService.addUser(userToSave); // addUser acts as upsert
        }

        // Return the updated user data
        return userToSave;
      }

      console.log(
        "Online authentication failed, falling back to local authentication",
      );

      // Fallback to local authentication if online fails
      const user = await IndexedDBService.getUser(email);

      if (!user || !user.is_active) {
        console.log("User not found locally or inactive");
        return null;
      }

      // Import password verification function
      const { verifyPassword } = await import("../lib/auth");

      // Verify password using SHA3 with email salt
      const isValidPassword = verifyPassword(
        password,
        email,
        user.password_hash,
      );

      if (isValidPassword) {
        console.log("Local authentication successful");
        return user;
      }

      console.log("Local authentication failed - invalid password");
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      return null;
    }
  };

  // Product operations - use unified database service
  const getProducts = async (searchTerm: string = ""): Promise<Product[]> => {
    const { UnifiedDatabaseService } = await import("@/lib/database-service");
    return await UnifiedDatabaseService.getProducts(searchTerm);
  };

  const getProductByEan = async (ean: string): Promise<Product | null> => {
    const { UnifiedDatabaseService } = await import("@/lib/database-service");
    return await UnifiedDatabaseService.getProductByEan(ean);
  };

  // Store operations - use IndexedDB directly for user store data
  const getStoreByCode = async (code: string) => {
    try {
      console.log("DatabaseService.getStoreByCode called for:", code);

      // Use IndexedDB service directly to get store with delivery center info
      const user = await IndexedDBService.getUser("luis@esgranvia.es"); // Use hardcoded user for now
      if (!user) {
        console.log("User not found, cannot get store");
        return null;
      }

      const storeWithDeliveryCenter = await IndexedDBService.getUserStore(
        user.email,
      );
      console.log("Store data loaded after sync:", storeWithDeliveryCenter);
      return storeWithDeliveryCenter;
    } catch (error) {
      console.error("Error getting store from IndexedDB:", error);
      return null;
    }
  };

  // Purchase order operations - use unified database service
  const getPurchaseOrders = async (
    userEmail: string,
  ): Promise<PurchaseOrder[]> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");
      const orders =
        await UnifiedDatabaseService.getPurchaseOrdersForUser(userEmail);
      console.log(
        "Purchase orders found:",
        orders.length,
        "for user:",
        userEmail,
      );
      return orders;
    } catch (error) {
      console.error("Error getting purchase orders:", error);
      return [];
    }
  };

  const getPurchaseOrderById = async (id: string): Promise<any> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");

      // Get all purchase orders first - pass empty string to get all orders
      const allOrders =
        await UnifiedDatabaseService.getPurchaseOrdersForUser("");
      const order = allOrders.find((o) => o.purchase_order_id === id);
      if (!order) {
        console.log(
          "Order not found with ID:",
          id,
          "Available orders:",
          allOrders.length,
        );
        return null;
      }

      // Get items
      const items = await UnifiedDatabaseService.getPurchaseOrderItems(id);

      // For items without snapshot data (legacy), fallback to current product data
      const enhancedItems = await Promise.all(
        items.map(async (item) => {
          if (!item.item_title) {
            // Fallback to current product data for legacy items
            const product = await UnifiedDatabaseService.getProductByEan(
              item.item_ean,
            );
            if (product) {
              return {
                ...item,
                item_title: product.title,
                item_description: product.description,
                unit_of_measure: product.unit_of_measure,
                quantity_measure: product.quantity_measure,
                image_url: product.image_url,
                title: product.title, // For backward compatibility
              };
            }
          }
          return {
            ...item,
            title: item.item_title, // For backward compatibility
          };
        }),
      );

      return { ...order, items: enhancedItems };
    } catch (error) {
      console.error("Error getting purchase order:", error);
      return null;
    }
  };

  // Orders operations - use unified database service
  const getOrders = async (userEmail: string): Promise<any[]> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");
      const orders = await UnifiedDatabaseService.getOrdersForUser(userEmail);
      console.log("Orders found:", orders.length, "for user:", userEmail);
      return orders;
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  };

  const getOrderById = async (id: string): Promise<any> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");

      // Get all orders - pass empty string to get all orders
      const allOrders = await UnifiedDatabaseService.getOrdersForUser("");
      const order = allOrders.find((o) => o.order_id === id);
      if (!order) {
        console.log(
          "Order not found with ID:",
          id,
          "Available orders:",
          allOrders.length,
        );
        return null;
      }

      // Get items
      const items = await UnifiedDatabaseService.getOrderItems(id);

      return { ...order, items };
    } catch (error) {
      console.error("Error getting order:", error);
      return null;
    }
  };

  const createPurchaseOrder = async (
    userEmail: string,
    storeId: string,
    cartItems: CartItem[],
  ): Promise<string> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");
      const purchaseOrderId = generatePurchaseOrderId();
      const now = new Date().toISOString();

      let subtotal = 0;
      let taxTotal = 0;

      // Calculate totals
      for (const item of cartItems) {
        const itemSubtotal = item.base_price * item.quantity;
        const itemTax = itemSubtotal * item.tax_rate;
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }

      const finalTotal = subtotal + taxTotal;

      // Initialize purchase order as "uncommunicated" - will change to "processing" if server sync succeeds
      const purchaseOrder = {
        purchase_order_id: purchaseOrderId,
        user_email: userEmail,
        store_id: storeId,
        created_at: now,
        status: "uncommunicated", // Always start as uncommunicated
        subtotal,
        tax_total: taxTotal,
        final_total: finalTotal,
        server_send_at: null, // Initialize as not sent to server
      };

      await UnifiedDatabaseService.createPurchaseOrder(purchaseOrder);

      // Add purchase order items using unified service
      const purchaseOrderItems: any[] = [];
      for (const item of cartItems) {
        // DEBUG: Log cart item ref field
        console.log(`🔍 Cart item debugging:`, {
          ean: item.ean,
          ref: item.ref,
          ref_type: typeof item.ref,
          title: item.title?.substring(0, 30),
        });

        const orderItem = {
          purchase_order_id: purchaseOrderId,
          item_ean: item.ean,
          item_ref: item.ref || "", // This should now have the correct ref
          item_title: item.title,
          item_description: item.description || "Producto",
          unit_of_measure: item.unit_of_measure || "unidad",
          quantity_measure: item.quantity_measure || 1,
          image_url: item.image_url || "",
          quantity: item.quantity,
          base_price_at_order: item.base_price,
          tax_rate_at_order: item.tax_rate,
        };

        console.log(`📦 Order item created with ref:`, orderItem.item_ref);
        purchaseOrderItems.push(orderItem);
        await UnifiedDatabaseService.addPurchaseOrderItem(orderItem);
      }

      // Send to GraphQL server in background - don't block user
      setTimeout(async () => {
        try {
          const { sendPurchaseOrderToServer } = await import(
            "../lib/purchase-order-sync"
          );
          const success = await sendPurchaseOrderToServer(
            purchaseOrder,
            purchaseOrderItems,
          );

          if (success) {
            // Update status to "processing" and set server_send_at timestamp
            const { UnifiedDatabaseService } = await import(
              "@/lib/database-service"
            );
            await UnifiedDatabaseService.updatePurchaseOrderStatus(
              purchaseOrderId,
              "processing",
            );
            await UnifiedDatabaseService.updatePurchaseOrderServerSentAt(
              purchaseOrderId,
              new Date().toISOString(),
            );
            console.log(
              `✅ Purchase order ${purchaseOrderId} sent to server successfully - status updated to 'processing'`,
            );
          } else {
            console.log(
              `💾 Purchase order ${purchaseOrderId} remains as 'uncommunicated' - will retry sync later`,
            );
          }
        } catch (serverError) {
          console.error(
            `Background sync failed for purchase order ${purchaseOrderId}:`,
            serverError,
          );
        }
      }, 100); // Send after 100ms to not block UI

      return purchaseOrderId;
    } catch (error) {
      console.error("Error creating purchase order:", error);
      throw error;
    }
  };

  // NOTE: Processed order creation is now handled by the GraphQL server
  // When the server receives a purchase order, it will simulate Musgrave IT processing
  // and send back the confirmed order via GraphQL subscription or polling

  // Get tax rate by code - use unified database service
  const getTaxRate = async (taxCode: string): Promise<number> => {
    try {
      const { UnifiedDatabaseService } = await import("@/lib/database-service");
      return await UnifiedDatabaseService.getTaxRate(taxCode);
    } catch (error) {
      console.error("Error getting tax rate:", error);
      return 0.21;
    }
  };

  return {
    isInitialized,
    isOffline,
    getUserByEmail,
    authenticateUser,
    getProducts,
    getProductByEan,
    getStoreByCode,
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    getOrders,
    getOrderById,
    getTaxRate,
  };
}
