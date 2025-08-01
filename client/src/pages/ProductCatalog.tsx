import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import { useDatabase } from '@/hooks/use-database';

interface ProductCatalogProps {
  cartItems: any[];
  onAddToCart: (ean: string, quantity: number) => void;
  onUpdateCart: (ean: string, quantity: number) => void;
  onRemoveFromCart: (ean: string) => void;
}

export default function ProductCatalog({ 
  cartItems, 
  onAddToCart, 
  onUpdateCart, 
  onRemoveFromCart 
}: ProductCatalogProps) {
  const { getProducts } = useDatabase();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const productList = await getProducts(searchTerm);
      setProducts(productList);
      setIsLoading(false);
    }

    loadProducts();
  }, [searchTerm]); // Remove getProducts from dependencies as it's recreated on every render

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500"
            placeholder="Buscar por EAN, REF o Nombre"
          />
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => {
            const cartItem = cartItems.find(item => item.ean === product.ean);
            return (
              <ProductCard
                key={product.ean}
                product={product}
                cartQuantity={cartItem?.quantity || 0}
                onAddToCart={onAddToCart}
                onUpdateCart={onUpdateCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            );
          })}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
        </div>
      )}
    </div>
  );
}
