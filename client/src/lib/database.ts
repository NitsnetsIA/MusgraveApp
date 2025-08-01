import initSqlJs from 'sql.js';

let SQL: any = null;
let db: any = null;

// Initialize SQL.js and create database
export async function initDatabase() {
  if (SQL && db) return db;

  try {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Check if we have existing data in localStorage
    const savedDb = localStorage.getItem('musgrave_db');
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
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
       display_price TEXT,
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
  db = null;
  SQL = null;
  return await initDatabase();
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
