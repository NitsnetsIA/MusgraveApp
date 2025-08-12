import { z } from "zod";

// Database schema types for IndexedDB
export interface Tax {
  code: string;
  name: string;
  tax_rate: number;
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

export interface DeliveryCenter {
  code: string;
  name: string;
}

export interface Store {
  code: string;
  name: string;
  responsible_email?: string;
  delivery_center_code: string;
  is_active: number; // 1 for true, 0 for false
}

export interface User {
  email: string;
  store_id: string;
  name?: string;
  password_hash: string;
  is_active: number; // 1 for true, 0 for false
}

export interface Product {
  ean: string;
  ref?: string;
  title: string;
  description?: string;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
  image_url?: string;
  is_active: number; // 1 for true, 0 for false
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

export interface PurchaseOrder {
  purchase_order_id: string; // UUID
  user_email: string;
  store_id: string;
  created_at: string; // ISO string
  status: 'uncommunicated' | 'processing' | 'completed';
  subtotal: number;
  tax_total: number;
  final_total: number;
  server_send_at?: string | null; // Timestamp when sent to server, null if not sent
}

export interface PurchaseOrderItem {
  item_id: number;
  purchase_order_id: string; // UUID
  item_ean: string;
  item_title: string; // Snapshot at order time
  item_description?: string; // Snapshot at order time
  unit_of_measure: string; // Snapshot at order time
  quantity_measure: number; // Snapshot at order time
  image_url?: string; // Snapshot at order time
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
}

export interface Order {
  order_id: string; // UUID
  source_purchase_order_id: string;
  user_email: string;
  store_id: string;
  created_at: string; // ISO string
  observations?: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
}

export interface OrderItem {
  item_id: number;
  order_id: string; // UUID
  item_ean: string;
  item_title: string; // Snapshot at order time
  item_description?: string; // Snapshot at order time
  unit_of_measure: string; // Snapshot at order time
  quantity_measure: number; // Snapshot at order time
  image_url?: string; // Snapshot at order time
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
}

export interface SyncConfig {
  entity_name: string;
  last_request_timestamp?: number;
  last_updated_timestamp?: number;
}

// Cart item type for frontend
export interface CartItem {
  ean: string;
  title: string;
  base_price: number;
  tax_rate: number;
  quantity: number;
  image_url?: string;
}

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const addToCartSchema = z.object({
  ean: z.string(),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type AddToCartForm = z.infer<typeof addToCartSchema>;
