import { useState, useEffect, memo, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useDatabase } from "@/hooks/use-database";

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
  onRemoveFromCart,
}: ProductCatalogProps) {
  const { getProducts, getProductByEan } = useDatabase();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeMessage, setBarcodeMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem("productCatalogPage");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const PRODUCTS_PER_PAGE = 60;

  // Use refs for scroll position preservation only
  const scrollPositionRef = useRef(0);

  // Save scroll position before loading
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      const productList = await getProducts(searchTerm);
      console.log(
        `ProductCatalog: Loaded ${productList.length} products${searchTerm ? ` (filtered by "${searchTerm}")` : " (all products)"}`,
      );
      setAllProducts(productList);

      // Reset to page 1 only when searching (not when clearing search via barcode)
      if (searchTerm.length > 0) {
        setCurrentPage(1);
        localStorage.setItem("productCatalogPage", "1");
      }

      setIsLoading(false);
    }

    loadProducts();
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = allProducts.slice(startIndex, endIndex);

  // Memoize cart lookup to prevent unnecessary re-renders
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach((item) => map.set(item.ean, item.quantity));
    return map;
  }, [cartItems]);

  // Memoize callback functions to prevent ProductCard re-renders while preserving scroll
  const memoizedOnAddToCart = useCallback(
    (ean: string, quantity: number) => {
      // Preserve scroll position during cart operations
      const currentScroll = window.scrollY;
      onAddToCart(ean, quantity);
      // Restore scroll position after operation
      setTimeout(() => window.scrollTo(0, currentScroll), 10);
    },
    [onAddToCart],
  );

  const memoizedOnUpdateCart = useCallback(
    (ean: string, quantity: number) => {
      const currentScroll = window.scrollY;
      onUpdateCart(ean, quantity);
      setTimeout(() => window.scrollTo(0, currentScroll), 10);
    },
    [onUpdateCart],
  );

  const memoizedOnRemoveFromCart = useCallback(
    (ean: string) => {
      const currentScroll = window.scrollY;
      onRemoveFromCart(ean);
      setTimeout(() => window.scrollTo(0, currentScroll), 10);
    },
    [onRemoveFromCart],
  );

  // Pagination handlers with localStorage persistence
  const goToFirstPage = () => {
    setCurrentPage(1);
    localStorage.setItem("productCatalogPage", "1");
  };
  const goToPreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    localStorage.setItem("productCatalogPage", newPage.toString());
  };
  const goToNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(newPage);
    localStorage.setItem("productCatalogPage", newPage.toString());
  };
  const goToLastPage = () => {
    setCurrentPage(totalPages);
    localStorage.setItem("productCatalogPage", totalPages.toString());
  };

  // Force refresh products by clearing and re-syncing
  const handleForceRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setBarcodeMessage("🔄 Limpiando productos y forzando sincronización...");
      
      // Clear products and sync config from IndexedDB
      const request = indexedDB.open('MsgDatabase', 1);
      
      request.onsuccess = async function(event) {
        const db = event.target.result as IDBDatabase;
        
        try {
          const transaction = db.transaction(['products', 'sync_config'], 'readwrite');
          
          await Promise.all([
            transaction.objectStore('products').clear(),
            transaction.objectStore('sync_config').delete('products')
          ]);
          
          console.log('✅ Products and sync config cleared - forcing fresh sync');
          setBarcodeMessage("✅ Productos limpiados - recargando página para sincronizar...");
          
          // Reload page to trigger fresh sync with ref fields
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
        } catch (error) {
          console.error('Error clearing products:', error);
          setBarcodeMessage("❌ Error al limpiar productos");
          setIsRefreshing(false);
        }
      };
      
      request.onerror = () => {
        console.error('Error accessing IndexedDB');
        setBarcodeMessage("❌ Error al acceder a la base de datos");
        setIsRefreshing(false);
      };
      
    } catch (error) {
      console.error('Error in force refresh:', error);
      setBarcodeMessage("❌ Error al forzar actualización");
      setIsRefreshing(false);
    }
  };

  // Handle barcode scanner input (EAN + Enter)
  const handleBarcodeInput = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      const ean = searchTerm.trim();

      // Check if input looks like an EAN (13 digits)
      if (/^\d{13}$/.test(ean)) {
        const product = await getProductByEan(ean);

        if (product) {
          // Add one unit to cart (scroll preserved by memoized callback)
          onAddToCart(ean, 1);

          // Show success message
          setBarcodeMessage(`✓ ${product.title} añadido al carrito`);
          setTimeout(() => setBarcodeMessage(""), 3000);

          // Clear search without resetting pagination
          setSearchTerm("");
        } else {
          // Show error message
          setBarcodeMessage(`✗ Producto con EAN ${ean} no encontrado`);
          setTimeout(() => setBarcodeMessage(""), 3000);
        }
      }
    }
  };

  return (
    <div className="p-4">
      {/* Search Bar with Force Refresh Button */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeInput}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500"
              placeholder="Buscar por EAN, REF o Nombre - Escáner: EAN + Enter"
            />
          </div>
          <Button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="px-4 py-3 border border-musgrave-300 hover:bg-musgrave-50 disabled:opacity-50"
            title="Forzar sincronización completa con referencias de productos"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Barcode Scanner Message */}
        {barcodeMessage && (
          <div
            className={`mt-2 p-3 rounded-lg text-sm font-medium ${
              barcodeMessage.startsWith("✓")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {barcodeMessage}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {!isLoading && allProducts.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 text-center">
          Mostrando {allProducts.length > 0 ? startIndex + 1 : 0}-
          {Math.min(endIndex, allProducts.length)} de {allProducts.length}{" "}
          productos
        </div>
      )}

      {/* Product Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop, 5 cols large screens */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border p-4 animate-pulse"
            >
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentProducts.map((product) => (
            <ProductCard
              key={product.ean}
              product={product}
              cartQuantity={cartItemsMap.get(product.ean) || 0}
              onAddToCart={memoizedOnAddToCart}
              onUpdateCart={memoizedOnUpdateCart}
              onRemoveFromCart={memoizedOnRemoveFromCart}
            />
          ))}
        </div>
      )}

      {!isLoading && allProducts.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {searchTerm
            ? "No se encontraron productos"
            : "No hay productos disponibles"}
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

// Export memoized component to prevent unnecessary re-renders when parent state changes
export default memo(ProductCatalog);
