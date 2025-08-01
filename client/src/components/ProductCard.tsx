import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductCardProps {
  product: any;
  cartQuantity?: number;
  onAddToCart: (ean: string, quantity: number) => void;
  onUpdateCart: (ean: string, quantity: number) => void;
  onRemoveFromCart: (ean: string) => void;
}

export default function ProductCard({ 
  product, 
  cartQuantity = 0, 
  onAddToCart, 
  onUpdateCart, 
  onRemoveFromCart 
}: ProductCardProps) {
  const [localQuantity, setLocalQuantity] = useState(1);
  const isInCart = cartQuantity > 0;

  useEffect(() => {
    if (isInCart) {
      setLocalQuantity(cartQuantity);
    }
  }, [cartQuantity, isInCart]);

  const handleQuantityChange = (newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    setLocalQuantity(qty);
    if (isInCart && qty > 0) {
      onUpdateCart(product.ean, qty);
    } else if (isInCart && qty === 0) {
      onRemoveFromCart(product.ean);
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
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
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
      
      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h3>
      
      <div className="text-xs text-gray-500 mb-2">
        <div>EAN: {product.ean}</div>
        <div>REF: {product.ean.substring(7)}</div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-musgrave-600">
          {product.base_price.toFixed(2)} €
          {product.display_price && (
            <span className="text-xs text-gray-500 ml-1">({product.display_price})</span>
          )}
        </div>
        {isInCart && (
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {isInCart ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(localQuantity - 1)}
            className="bg-musgrave-100 text-musgrave-600 w-8 h-8 rounded flex items-center justify-center hover:bg-musgrave-200"
          >
            <Minus className="h-4 w-4" />
          </button>
          <Input
            type="number"
            value={localQuantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
            className="w-16 text-center border-musgrave-200 focus:border-musgrave-500"
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
          className="w-full bg-musgrave-500 hover:bg-musgrave-600 text-white"
        >
          AÑADIR
        </Button>
      )}
    </div>
  );
}
