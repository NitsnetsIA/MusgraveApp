// Migration utility to update existing databases with new schema
import { query, execute } from './database';

export async function migrateToNewSchema() {
  try {
    // Check if products table already has quantity_measure column
    const columns = query("PRAGMA table_info(products)");
    const hasQuantityMeasure = columns.some(col => col.name === 'quantity_measure');
    
    if (!hasQuantityMeasure) {
      console.log('Adding quantity_measure column to products table...');
      execute('ALTER TABLE products ADD COLUMN quantity_measure REAL DEFAULT 1.0');
      
      // Update existing products with quantity_measure values based on their titles
      const products = query('SELECT * FROM products');
      
      for (const product of products) {
        let quantityMeasure = 1.0;
        
        // Extract quantity from title
        const title = product.title;
        
        // Patterns for different units
        if (title.includes('Kg') || title.includes('kg')) {
          const match = title.match(/(\d+(?:\.\d+)?)\s*[Kk][Gg]/);
          if (match) quantityMeasure = parseFloat(match[1]);
        } else if (title.includes('L') && !title.includes('ml')) {
          const match = title.match(/(\d+(?:\.\d+)?)\s*L/);
          if (match) quantityMeasure = parseFloat(match[1]);
        } else if (title.includes('ml')) {
          const match = title.match(/(\d+(?:\.\d+)?)\s*ml/);
          if (match) quantityMeasure = parseFloat(match[1]) / 1000; // Convert to L
        } else if (title.includes('g') && !title.includes('Kg')) {
          const match = title.match(/(\d+(?:\.\d+)?)\s*g/);
          if (match) quantityMeasure = parseFloat(match[1]) / 1000; // Convert to kg
        } else if (title.includes('pack')) {
          const match = title.match(/pack\s+(\d+)/i);
          if (match) quantityMeasure = parseFloat(match[1]);
        } else if (title.includes('pastillas')) {
          const match = title.match(/(\d+)\s+pastillas/);
          if (match) quantityMeasure = parseFloat(match[1]);
        }
        
        execute(`UPDATE products SET quantity_measure = ? WHERE ean = ?`, [quantityMeasure, product.ean]);
      }
      
      console.log('Migration completed successfully');
    }
    
    // Remove display_price column if it exists
    const hasDisplayPrice = columns.some(col => col.name === 'display_price');
    if (hasDisplayPrice) {
      console.log('Removing display_price column...');
      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      execute(`
        CREATE TABLE products_new (
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
        )
      `);
      
      execute(`
        INSERT INTO products_new (ean, ref, title, description, base_price, tax_code, unit_of_measure, quantity_measure, image_url, is_active)
        SELECT ean, ref, title, description, base_price, tax_code, unit_of_measure, quantity_measure, image_url, is_active FROM products
      `);
      
      execute('DROP TABLE products');
      execute('ALTER TABLE products_new RENAME TO products');
      
      console.log('display_price column removed successfully');
    }
    
    // Check if purchase_order_items table needs product snapshot columns
    const poiColumns = query("PRAGMA table_info(purchase_order_items)");
    const hasItemTitle = poiColumns.some(col => col.name === 'item_title');
    
    if (!hasItemTitle) {
      console.log('Adding product snapshot columns to purchase_order_items...');
      execute('ALTER TABLE purchase_order_items ADD COLUMN item_title TEXT');
      execute('ALTER TABLE purchase_order_items ADD COLUMN item_description TEXT');  
      execute('ALTER TABLE purchase_order_items ADD COLUMN unit_of_measure TEXT');
      execute('ALTER TABLE purchase_order_items ADD COLUMN quantity_measure REAL');
      execute('ALTER TABLE purchase_order_items ADD COLUMN image_url TEXT');
      
      // Update existing purchase_order_items with current product data
      const existingItems = query('SELECT * FROM purchase_order_items');
      for (const item of existingItems) {
        const products = query('SELECT * FROM products WHERE ean = ?', [item.item_ean]);
        if (products.length > 0) {
          const product = products[0];
          execute(`UPDATE purchase_order_items 
                   SET item_title = ?, item_description = ?, unit_of_measure = ?, quantity_measure = ?, image_url = ?
                   WHERE item_id = ?`, 
                   [product.title, product.description, product.unit_of_measure, product.quantity_measure, product.image_url, item.item_id]);
        }
      }
      
      console.log('Purchase order items migration completed');
    }
    
    // Check if order_items table needs product snapshot columns  
    const oiColumns = query("PRAGMA table_info(order_items)");
    const hasOrderItemTitle = oiColumns.some(col => col.name === 'item_title');
    
    if (!hasOrderItemTitle) {
      console.log('Adding product snapshot columns to order_items...');
      execute('ALTER TABLE order_items ADD COLUMN item_title TEXT');
      execute('ALTER TABLE order_items ADD COLUMN item_description TEXT');
      execute('ALTER TABLE order_items ADD COLUMN unit_of_measure TEXT');
      execute('ALTER TABLE order_items ADD COLUMN quantity_measure REAL');
      execute('ALTER TABLE order_items ADD COLUMN image_url TEXT');
      
      // Update existing order_items with current product data
      const existingOrderItems = query('SELECT * FROM order_items');
      for (const item of existingOrderItems) {
        const products = query('SELECT * FROM products WHERE ean = ?', [item.item_ean]);
        if (products.length > 0) {
          const product = products[0];
          execute(`UPDATE order_items 
                   SET item_title = ?, item_description = ?, unit_of_measure = ?, quantity_measure = ?, image_url = ?
                   WHERE item_id = ?`, 
                   [product.title, product.description, product.unit_of_measure, product.quantity_measure, product.image_url, item.item_id]);
        }
      }
      
      console.log('Order items migration completed');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Helper function to calculate display price
export function calculateDisplayPrice(basePrice: number, quantityMeasure: number, unitOfMeasure: string): string {
  const pricePerUnit = basePrice / quantityMeasure;
  
  switch (unitOfMeasure) {
    case 'KG':
      return `${pricePerUnit.toFixed(2).replace('.', ',')} €/KILO`;
    case 'L':
      return `${pricePerUnit.toFixed(2).replace('.', ',')} €/LITRO`;
    case 'UD':
      if (quantityMeasure > 1) {
        return `${pricePerUnit.toFixed(2).replace('.', ',')} €/UD`;
      } else {
        return `${basePrice.toFixed(2).replace('.', ',')} €/UD`;
      }
    case 'PACK':
      return `${pricePerUnit.toFixed(2).replace('.', ',')} €/UD`;
    default:
      return `${basePrice.toFixed(2).replace('.', ',')} €`;
  }
}