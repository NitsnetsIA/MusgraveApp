import { useState, useEffect, useRef, memo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSpanishCurrency, formatPricePerUnit } from '@/lib/utils/currency';
// Function moved inline since schema-migrate was deleted
const calculateDisplayPrice = (basePrice: number, taxRate: number): number => {
  return basePrice * (1 + taxRate);
};

interface ProductCardProps {
  product: any;
  cartQuantity?: number;
  onAddToCart: (ean: string, quantity: number) => void;
  onUpdateCart: (ean: string, quantity: number) => void;
  onRemoveFromCart: (ean: string) => void;
}

function ProductCard({ 
  product, 
  cartQuantity = 0, 
  onAddToCart, 
  onUpdateCart, 
  onRemoveFromCart 
}: ProductCardProps) {
  const [localQuantity, setLocalQuantity] = useState(() => cartQuantity || 1);
  const [inputValue, setInputValue] = useState(() => (cartQuantity || 1).toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const isInCart = cartQuantity > 0;
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const prevCartQuantityRef = useRef(cartQuantity);

  // Only update local state if cart quantity actually changed (not on re-renders)
  useEffect(() => {
    if (cartQuantity !== prevCartQuantityRef.current) {
      prevCartQuantityRef.current = cartQuantity;
      if (isInCart) {
        setLocalQuantity(cartQuantity);
        setInputValue(cartQuantity.toString());
      }
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

  const handleQuantityChange = (newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    
    // Update local state immediately for responsive UI
    setLocalQuantity(qty);
    setInputValue(qty.toString());
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Immediate update for button clicks to reduce flickering
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
      }, 300); // Shorter delay for typing
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product.ean, 1); // Always add 1 when clicking AÑADIR
  };

  const handleRemove = () => {
    onRemoveFromCart(product.ean);
    setLocalQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 h-[360px] flex flex-col">
      {/* Fixed height image section */}
      <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center flex-shrink-0">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="text-xs text-gray-500">SIN IMAGEN</div>
        )}
      </div>
      
      {/* Fixed height title section - exactly 2 lines */}
      <div className="h-10 mb-2 flex-shrink-0">
        <h3 className="font-medium text-sm leading-5 line-clamp-2 overflow-hidden text-ellipsis">
          {product.title}
        </h3>
      </div>
      
      {/* Fixed height EAN/REF section with better spacing */}
      <div className="text-xs text-gray-500 mb-4 h-8 flex-shrink-0">
        <div>EAN: {product.ean}</div>
        <div>REF: {product.ean.substring(7)}</div>
      </div>
      
      {/* Fixed height price section - always 2 lines */}
      <div className="flex items-start justify-between mb-3 h-12 flex-shrink-0">
        <div className="flex flex-col justify-between h-12">
          <div className="text-lg font-bold text-musgrave-600 leading-tight">
            {formatSpanishCurrency(product.base_price)}
          </div>
          <div className="text-xs text-gray-500 leading-tight h-4">
            {product.quantity_measure && product.unit_of_measure 
              ? formatPricePerUnit(product.base_price, product.quantity_measure, product.unit_of_measure)
              : '\u00A0'
            }
          </div>
        </div>
        {isInCart && (
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 p-1 mt-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Spacer to push button to bottom */}
      <div className="flex-grow"></div>
      
      {/* Fixed height button section */}
      <div className="h-10 flex items-center">
        {isInCart ? (
          <div className="flex items-center space-x-2 w-full">
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              className="bg-musgrave-100 text-musgrave-600 w-8 h-8 rounded flex items-center justify-center hover:bg-musgrave-200"
            >
              <Minus className="h-4 w-4" />
            </button>
            <Input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              className="w-16 text-center border-musgrave-200 focus:border-musgrave-500 h-8"
              min="1"
            />
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              className="bg-musgrave-100 text-musgrave-600 w-8 h-8 rounded flex items-center justify-center hover:bg-musgrave-200"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            className="w-full bg-musgrave-500 hover:bg-musgrave-600 text-white h-10"
          >
            AÑADIR
          </Button>
        )}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders when props haven't changed
export default memo(ProductCard);
