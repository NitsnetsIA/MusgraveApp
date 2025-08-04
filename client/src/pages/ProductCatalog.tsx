import { useState, useEffect, memo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useDatabase } from '@/hooks/use-database';

interface ProductCatalogProps {
  cartItems: any[];
  onAddToCart: (ean: string, quantity: number) => void;
  onUpdateCart: (ean: string, quantity: number) => void;
  onRemoveFromCart: (ean: string) => void;
}

function ProductCatalog({ 
  cartItems, 
  onAddToCart, 
  onUpdateCart, 
  onRemoveFromCart 
}: ProductCatalogProps) {
  const { getProducts, getProductByEan } = useDatabase();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 60;
  const [shouldResetPagination, setShouldResetPagination] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const productList = await getProducts(searchTerm);
      setAllProducts(productList);
      
      // Only reset pagination when explicitly requested (user search, not barcode clearing)
      if (shouldResetPagination) {
        setCurrentPage(1);
      }
      
      setIsLoading(false);
    }

    loadProducts();
  }, [searchTerm, shouldResetPagination]);

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = allProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Handle barcode scanner input (EAN + Enter)
  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const ean = searchTerm.trim();
      
      // Check if input looks like an EAN (13 digits)
      if (/^\d{13}$/.test(ean)) {
        const product = await getProductByEan(ean);
        
        if (product) {
          // Add one unit to cart
          onAddToCart(ean, 1);
          
          // Show success message
          setBarcodeMessage(`✓ ${product.title} añadido al carrito`);
          setTimeout(() => setBarcodeMessage(''), 3000);
          
          // Clear search without resetting pagination
          setShouldResetPagination(false);
          setSearchTerm('');
          // Re-enable pagination reset for next search
          setTimeout(() => setShouldResetPagination(true), 100);
        } else {
          // Show error message
          setBarcodeMessage(`✗ Producto con EAN ${ean} no encontrado`);
          setTimeout(() => setBarcodeMessage(''), 3000);
        }
      }
    }
  };

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setShouldResetPagination(true); // Manual typing should reset pagination
              setSearchTerm(e.target.value);
            }}
            onKeyDown={handleBarcodeInput}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500"
            placeholder="Buscar por EAN, REF o Nombre - Escáner: EAN + Enter"
          />
        </div>
        
        {/* Barcode Scanner Message */}
        {barcodeMessage && (
          <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${
            barcodeMessage.startsWith('✓') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {barcodeMessage}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {!isLoading && allProducts.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 text-center">
          Mostrando {allProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, allProducts.length)} de {allProducts.length} productos
        </div>
      )}

      {/* Product Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop, 5 cols large screens */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentProducts.map((product) => {
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

      {!isLoading && allProducts.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
        </div>
      )}

      {/* Pagination Controls - Mobile-friendly */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          {/* First Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="p-2"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Counter */}
          <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded">
            {currentPage}/{totalPages}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ProductCatalog);
