import initSqlJs from 'sql.js';
import { migrateToNewSchema } from './schema-migrate';

let SQL: any = null;
let db: any = null;

// Initialize SQL.js and create database
export async function initDatabase() {
  if (SQL && db) return db;

  try {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Check schema version and force recreation if needed
    const schemaVersion = localStorage.getItem('musgrave_schema_version');
    const currentVersion = '2.1'; // Updated for product snapshots
    
    if (schemaVersion !== currentVersion) {
      console.log('Schema version mismatch, recreating database...');
      localStorage.removeItem('musgrave_db');
      localStorage.setItem('musgrave_schema_version', currentVersion);
    }

    // Check if we have existing data in localStorage
    const savedDb = localStorage.getItem('musgrave_db');
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
      // Try to migrate schema if needed
      try {
        await migrateToNewSchema();
      } catch (error) {
        console.log('Migration failed, recreating database...', error);
        localStorage.removeItem('musgrave_db');
        db = new SQL.Database();
        await createTables();
        const { seedDatabase } = await import('./seed-data');
        await seedDatabase();
      }
    } else {
      console.log('Creating new database...');
      db = new SQL.Database();
      console.log('Creating tables...');
      await createTables();
      console.log('Tables created, now seeding...');
      // Dynamically import to avoid circular dependency
      const { seedDatabase } = await import('./seed-data');
      await seedDatabase();
      console.log('Database initialization complete');
    }

    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Create all tables according to schema
async function createTables() {
  const sql = `
    -- Tabla de Tipos de IVA
    CREATE TABLE taxes (
       code TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       tax_rate REAL NOT NULL
    );

    -- Tabla de Puntos de Entrega
    CREATE TABLE delivery_centers (
       code TEXT PRIMARY KEY,
       name TEXT NOT NULL
    );

    -- Tabla de Tiendas
    CREATE TABLE stores (
       code TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       responsible_email TEXT,
       delivery_center_code TEXT NOT NULL,
       is_active INTEGER NOT NULL DEFAULT 1,
       CONSTRAINT fk_delivery_center FOREIGN KEY(delivery_center_code) REFERENCES delivery_centers(code)
    );

    -- Tabla de Usuarios
    CREATE TABLE users (
       email TEXT PRIMARY KEY,
       store_id TEXT NOT NULL,
       name TEXT,
       password_hash TEXT NOT NULL,
       is_active INTEGER NOT NULL DEFAULT 1,
       CONSTRAINT fk_store FOREIGN KEY(store_id) REFERENCES stores(code)
    );

    -- Tabla de Productos
    CREATE TABLE products (
       ean TEXT PRIMARY KEY,
       ref TEXT,
       title TEXT NOT NULL,
       description TEXT,
       base_price REAL NOT NULL,
       tax_code TEXT NOT NULL,
       unit_of_measure TEXT NOT NULL,
       quantity_measure REAL NOT NULL,
       image_url TEXT,
       is_active INTEGER NOT NULL DEFAULT 1,
       CONSTRAINT fk_tax FOREIGN KEY(tax_code) REFERENCES taxes(code)
    );

    -- Tabla de Órdenes de Compra
    CREATE TABLE purchase_orders (
       purchase_order_id TEXT PRIMARY KEY,
       user_email TEXT NOT NULL,
       store_id TEXT NOT NULL,
       created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
       status TEXT NOT NULL,
       subtotal REAL NOT NULL,
       tax_total REAL NOT NULL,
       final_total REAL NOT NULL,
       CONSTRAINT fk_user FOREIGN KEY(user_email) REFERENCES users(email),
       CONSTRAINT fk_store FOREIGN KEY(store_id) REFERENCES stores(code)
    );

    -- Tabla de Líneas de Órdenes de Compra
    CREATE TABLE purchase_order_items (
       item_id INTEGER PRIMARY KEY AUTOINCREMENT,
       purchase_order_id TEXT NOT NULL,
       item_ean TEXT NOT NULL,
       item_title TEXT,
       item_description TEXT,
       unit_of_measure TEXT,
       quantity_measure REAL,
       image_url TEXT,
       quantity REAL NOT NULL,
       base_price_at_order REAL NOT NULL,
       tax_rate_at_order REAL NOT NULL,
       CONSTRAINT fk_purchase_order FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
    );

    -- Tabla de Pedidos (Finales)
    CREATE TABLE orders (
       order_id TEXT PRIMARY KEY,
       source_purchase_order_id TEXT NOT NULL UNIQUE,
       user_email TEXT NOT NULL,
       store_id TEXT NOT NULL,
       created_at TEXT NOT NULL,
       observations TEXT,
       subtotal REAL NOT NULL,
       tax_total REAL NOT NULL,
       final_total REAL NOT NULL,
       CONSTRAINT fk_source_purchase_order FOREIGN KEY(source_purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
    );

    -- Tabla de Líneas de Pedido (Finales)
    CREATE TABLE order_items (
       item_id INTEGER PRIMARY KEY AUTOINCREMENT,
       order_id TEXT NOT NULL,
       item_ean TEXT NOT NULL,
       item_title TEXT,
       item_description TEXT,
       unit_of_measure TEXT,
       quantity_measure REAL,
       image_url TEXT,
       quantity REAL NOT NULL,
       base_price_at_order REAL NOT NULL,
       tax_rate_at_order REAL NOT NULL,
       CONSTRAINT fk_order FOREIGN KEY(order_id) REFERENCES orders(order_id)
    );

    -- Tabla de Configuración de Sincronización
    CREATE TABLE sync_config (
       entity_name TEXT PRIMARY KEY,
       last_request_timestamp INTEGER,
       last_updated_timestamp INTEGER
    );
  `;

  db.exec(sql);
}

// Save database to localStorage
export function saveDatabase() {
  if (db) {
    const data = db.export();
    localStorage.setItem('musgrave_db', JSON.stringify(Array.from(data)));
  }
}

// Clear and reinitialize database
export async function clearAndReinitDatabase() {
  localStorage.removeItem('musgrave_db');
  localStorage.removeItem('musgrave_schema_version');
  db = null;
  SQL = null;
  return await initDatabase();
}

// Clear database completely (no data, no users)
export async function clearDatabaseCompletely() {
  localStorage.removeItem('musgrave_db');
  localStorage.removeItem('musgrave_schema_version');
  db = null;
  SQL = null;
  
  // Initialize empty database with tables only
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  db = new SQL.Database();
  await createTables();
  
  // Set schema version
  localStorage.setItem('musgrave_schema_version', '2.1');
  
  console.log('Database cleared completely - no users or data');
  return db;
}

// Reset database to initial test data
export async function resetDatabaseToTestData() {
  localStorage.removeItem('musgrave_db');
  localStorage.removeItem('musgrave_schema_version');
  db = null;
  SQL = null;
  
  // Reinitialize with test data
  const freshDb = await initDatabase();
  console.log('Database reset to initial test data');
  return freshDb;
}

// Execute query and return results
export function query(sql: string, params: any[] = []) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const stmt = db.prepare(sql);
    const results: any[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Execute statement (INSERT, UPDATE, DELETE)
export function execute(sql: string, params: any[] = []) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
    saveDatabase();
  } catch (error) {
    console.error('Execute error:', error);
    throw error;
  }
}

// Generate UUID for IDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate Purchase Order ID in format: [store code]-[timestamp YYMMDDHHMMSS]-[3 alphanumeric digits]
export function generatePurchaseOrderId(storeCode: string): string {
  const now = new Date();
  
  // Format timestamp as YYMMDDHHMMSS
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // Generate 3 alphanumeric characters
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${storeCode}-${timestamp}-${suffix}`;
}

// Generate Processed Order ID in format: [musgrave center code]-[timestamp YYMMDDHHMMSS]-[3 alphanumeric digits]
export function generateProcessedOrderId(musgraveCenterCode: string): string {
  const now = new Date();
  
  // Format timestamp as YYMMDDHHMMSS
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // Generate 3 alphanumeric characters
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${musgraveCenterCode}-${timestamp}-${suffix}`;
}
