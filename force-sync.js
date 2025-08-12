// Temporal script to force full sync and debug product loading
const GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

async function forceProductSync() {
  console.log('🔄 Force syncing products from GraphQL...');
  
  const query = `
    query {
      products(limit: 10, offset: 0) {
        products {
          ean
          title
          is_active
          base_price
        }
        total
      }
    }
  `;
  
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    console.log('GraphQL Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.products) {
      console.log(`✅ Server has ${data.data.products.total} products available`);
      console.log(`✅ First 10 products loaded successfully`);
    }
  } catch (error) {
    console.error('❌ GraphQL request failed:', error);
  }
}

forceProductSync();