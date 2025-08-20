import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ChevronLeft, Minus, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDatabase } from '@/hooks/use-database';
import { formatSpanishCurrency, formatPricePerUnit } from '@/lib/utils/currency';

interface ProductDetailProps {
  onAddToCart: (ean: string, quantity: number) => void;
  onUpdateCart: (ean: string, quantity: number) => void;
  onRemoveFromCart: (ean: string) => void;
  cartItems: any[];
  isCartPending?: boolean;
}

export default function ProductDetail({ 
  onAddToCart, 
  onUpdateCart, 
  onRemoveFromCart, 
  cartItems,
  isCartPending = false
}: ProductDetailProps) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/products/:ean');
  const { getProductByEan } = useDatabase();
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [inputValue, setInputValue] = useState('1');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Get cart quantity for this product
  const cartItem = cartItems.find(item => item.ean === params?.ean);
  const cartQuantity = cartItem?.quantity || 0;
  const isInCart = cartQuantity > 0;

  // Update local quantity when cart quantity changes
  useEffect(() => {
    if (isInCart) {
      setLocalQuantity(cartQuantity);
      setInputValue(cartQuantity.toString());
    }
  }, [cartQuantity, isInCart]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Load product data
  useEffect(() => {
    async function loadProduct() {
      if (!params?.ean) return;
      
      setIsLoading(true);
      try {
        const productData = await getProductByEan(params.ean);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
      }
      setIsLoading(false);
    }

    loadProduct();
  }, [params?.ean]);

  const handleQuantityChange = (newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    
    // Update local state immediately for responsive UI
    setLocalQuantity(qty);
    setInputValue(qty.toString());
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Immediate update for button clicks
    if (isInCart && qty > 0) {
      onUpdateCart(product.ean, qty);
    } else if (isInCart && qty === 0) {
      onRemoveFromCart(product.ean);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numericValue = parseInt(value) || 0;
    if (numericValue >= 0) {
      setLocalQuantity(numericValue);
      
      // Debounce the cart update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        if (isInCart && numericValue > 0) {
          onUpdateCart(product.ean, numericValue);
        } else if (isInCart && numericValue === 0) {
          onRemoveFromCart(product.ean);
        }
      }, 300);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product.ean, 1);
  };

  // Get available images for carousel
  const getAvailableImages = () => {
    const images = [];
    if (product?.image_url) {
      images.push({ url: product.image_url, type: 'product', label: 'Producto' });
    }
    if (product?.nutrition_label_url) {
      images.push({ url: product.nutrition_label_url, type: 'nutrition', label: 'Información Nutricional' });
    }
    return images;
  };

  const availableImages = getAvailableImages();
  const hasMultipleImages = availableImages.length > 1;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 mt-8">
          Producto no encontrado
        </div>
      </div>
    );
  }

  // Use the same price calculation as ProductCard
  const finalPrice = Number(product.base_price) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/catalog')}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              Detalle del Producto
            </h1>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Product Image Carousel */}
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden relative">
            {availableImages.length > 0 ? (
              <>
                <img 
                  src={availableImages[currentImageIndex]?.url} 
                  alt={availableImages[currentImageIndex]?.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const nextElement = target.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 absolute"
                  style={{ display: 'none' }}
                >
                  <span className="text-4xl">📦</span>
                </div>
                
                {/* Carousel Controls */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === 0 ? availableImages.length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === availableImages.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {availableImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Image Label */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {availableImages[currentImageIndex]?.label}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                <span className="text-4xl">📦</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6">
            {/* Title and Price */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                {product.title}
              </h1>
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <div className="text-2xl font-bold text-musgrave-600">
                    {formatSpanishCurrency(finalPrice)}
                  </div>
                  {/* Price per unit like in ProductCard */}
                  <div className="text-sm text-gray-500">
                    {product.quantity_measure && product.unit_of_measure 
                      ? formatPricePerUnit(product.base_price, product.quantity_measure, product.unit_of_measure)
                      : ''
                    }
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  IVA {((Number(product.tax_rate) || 0) * 100).toFixed(0)}% incl.
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="mb-6 space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">EAN:</span> {product.ean}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">REF:</span> {product.ref || 'NO REF'}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Unidad:</span> {product.unit_of_measure || 'unidad'}
              </div>
              {product.quantity_measure && product.quantity_measure !== 1 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Cantidad por unidad:</span> {product.quantity_measure}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="border-t pt-6">
              {isInCart ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleQuantityChange(localQuantity - 1)}
                      className="bg-musgrave-100 text-musgrave-600 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-musgrave-200 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <Input
                      ref={inputRef}
                      type="number"
                      value={inputValue}
                      onChange={handleInputChange}
                      className="w-24 text-center border-musgrave-200 focus:border-musgrave-500 h-12 text-lg font-medium"
                      min="1"
                    />
                    <button
                      onClick={() => handleQuantityChange(localQuantity + 1)}
                      className="bg-musgrave-100 text-musgrave-600 w-12 h-12 rounded-lg flex items-center justify-center hover:bg-musgrave-200 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      En carrito: {cartQuantity} unidades
                    </p>
                    <Button
                      onClick={() => onRemoveFromCart(product.ean)}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Quitar del carrito
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={isCartPending}
                  className={`w-full h-12 text-lg font-medium ${
                    isCartPending 
                      ? 'bg-musgrave-300 cursor-not-allowed' 
                      : 'bg-musgrave-500 hover:bg-musgrave-600'
                  } text-white`}
                  size="lg"
                >
                  {isCartPending ? 'AÑADIENDO...' : 'AÑADIR AL CARRITO'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}