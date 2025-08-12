// Force sync products to ensure ref field is included
const GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

async function testProductSync() {
  console.log('🔄 Testing GraphQL product sync with ref field...');
  
  const query = `
    query {
      products(limit: 5) {
        products {
          ean
          ref
          title
          description
          base_price
          tax_code
          unit_of_measure
          quantity_measure
          image_url
          is_active
          created_at
          updated_at
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
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return;
    }
    
    const products = data.data.products.products;
    console.log('✅ GraphQL returned products with ref:');
    products.forEach(p => {
      console.log(`- EAN: ${p.ean}, REF: ${p.ref || 'MISSING'}, Title: ${p.title}`);
    });
    
    // Test specific product that should have PROT2703
    console.log('\n🔍 Looking for specific product 84147523809...');
    const specificProduct = products.find(p => p.ean === '84147523809');
    if (specificProduct) {
      console.log('Found it! REF:', specificProduct.ref);
    } else {
      console.log('Not found in first 5, querying specifically...');
      
      const specificQuery = `
        query {
          products(where: { ean: "84147523809" }) {
            products {
              ean
              ref
              title
            }
          }
        }
      `;
      
      const specificResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: specificQuery })
      });
      
      const specificData = await specificResponse.json();
      console.log('Specific product result:', specificData);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testProductSync();