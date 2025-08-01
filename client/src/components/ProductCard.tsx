import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductCardProps {
  product: any;
  onAddToCart: (ean: string, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(0, newQuantity));
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product.ean, quantity);
      setQuantity(1);
    }
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
      
      <div className="text-lg font-bold text-musgrave-600 mb-3">
        {product.base_price.toFixed(2)} €
        {product.display_price && (
          <span className="text-xs text-gray-500 ml-1">({product.display_price})</span>
        )}
      </div>
      
      <div className="flex items-center space-x-2 mb-3">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="bg-gray-200 text-gray-600 w-8 h-8 rounded flex items-center justify-center"
        >
          <Minus className="h-4 w-4" />
        </button>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
          className="w-12 text-center"
          min="0"
        />
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="bg-gray-200 text-gray-600 w-8 h-8 rounded flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      <Button
        onClick={handleAddToCart}
        className="w-full bg-musgrave-500 hover:bg-musgrave-600 text-white"
        disabled={quantity === 0}
      >
        AÑADIR
      </Button>
    </div>
  );
}
