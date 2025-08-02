import { ChevronLeft, Minus, Plus, ShoppingCart, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDatabase } from '@/hooks/use-database';
import { formatSpanishCurrency } from '@/lib/utils/currency';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onUpdateQuantity: (ean: string, quantity: number) => void;
  onRemoveItem: (ean: string) => void;
  onCheckout: () => void;
  onAddToCart: (ean: string, quantity: number) => void;
  onCreateTestCart?: () => void;
  store?: any;
}

export default function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onAddToCart,
  onCreateTestCart,
  store
}: CartProps) {
  const { getProductByEan } = useDatabase();
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.base_price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + (price * qty);
  }, 0);
  
  const taxTotal = items.reduce((sum, item) => {
    const price = Number(item.base_price) || 0;
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.tax_rate) || 0;
    return sum + (price * qty * rate);
  }, 0);
  
  const total = subtotal + taxTotal;

  // Global barcode scanner for when input is not focused
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // Only handle if no input is focused and it's a digit
      if (document.activeElement?.tagName !== 'INPUT' && /\d/.test(e.key)) {
        const inputElement = document.getElementById('barcode-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.value = e.key;
          setBarcodeInput(e.key);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeydown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [isOpen]);

  // Handle barcode scanner input
  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const ean = barcodeInput.trim();
      
      // Check if input looks like an EAN (13 digits)
      if (/^\d{13}$/.test(ean)) {
        const product = await getProductByEan(ean);
        
        if (product) {
          // Add one unit to cart
          onAddToCart(ean, 1);
          
          // Mark as newly added for highlighting
          setAddedProduct(ean);
          
          // Scroll to top to show the newly added product
          setTimeout(() => {
            const productsList = document.querySelector('.products-list');
            if (productsList) {
              productsList.scrollTop = 0;
            }
          }, 100);
          
          // Clear highlighting after a few seconds
          setTimeout(() => {
            setAddedProduct(null);
          }, 5000);
          
          // Clear barcode input
          setBarcodeInput('');
          setBarcodeMessage('');
        } else {
          // Show error message
          setBarcodeMessage(`✗ Producto con EAN ${ean} no encontrado`);
          setTimeout(() => setBarcodeMessage(''), 3000);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="mr-3 p-0"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Button>
          <ShoppingCart className="h-5 w-5 mr-2" />
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>

        {/* Delivery Center Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-center text-sm text-gray-600">
            Centro de entrega Musgrave: {store?.delivery_center_name || '122 - Dolores (Alicante)'}
          </div>
        </div>
        
        {/* Products Table */}
        <div className="flex-1 overflow-y-auto products-list">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 p-4">
              <div className="mb-4">Su carrito está vacío</div>
              {onCreateTestCart && (
                <button
                  onClick={onCreateTestCart}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  Crear carrito de test (30 productos)
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b grid grid-cols-12 gap-1 text-xs font-medium text-gray-700 p-3">
                <div className="col-span-4">Producto</div>
                <div className="col-span-2 text-center">Base+IVA</div>
                <div className="col-span-3 text-center">Unidades</div>
                <div className="col-span-3 text-center">Importe</div>
              </div>

              {/* Products */}
              <div className="divide-y">
                {items.map((item) => {
                  const price = Number(item.base_price) || 0;
                  const qty = Number(item.quantity) || 0;
                  const rate = Number(item.tax_rate) || 0;
                  const baseTotal = price * qty;
                  const taxAmount = baseTotal * rate;
                  const totalWithTax = baseTotal + taxAmount;
                  const isNewlyAdded = addedProduct === item.ean;
                  
                  return (
                    <div 
                      key={item.ean} 
                      className={`p-3 grid grid-cols-12 gap-1 items-center transition-all duration-500 ${
                        isNewlyAdded ? 'bg-green-100 border-l-4 border-musgrave-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Product */}
                      <div className="col-span-4 flex items-center min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-tight line-clamp-2" style={{lineHeight: "1.2", minHeight: "2.4em"}}>{item.title}</div>
                        </div>
                      </div>
                      
                      {/* Price (Base + IVA) - 3 lines */}
                      <div className="col-span-2 text-center text-xs leading-none">
                        <div className="mb-0.5">{formatSpanishCurrency(price)}</div>
                        <div className="mb-0.5">{formatSpanishCurrency(price * rate)}</div>
                        <div className="text-gray-500">{(rate * 100).toFixed(0)}%</div>
                      </div>
                      
                      {/* Units with controls */}
                      <div className="col-span-3 flex items-center justify-center">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => onUpdateQuantity(item.ean, Math.max(0, item.quantity - 1))}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          {editingQuantity === item.ean ? (
                            <input
                              type="number"
                              value={tempQuantity}
                              onChange={(e) => setTempQuantity(e.target.value)}
                              onBlur={() => {
                                const newQty = parseInt(tempQuantity) || 0;
                                if (newQty > 0) {
                                  onUpdateQuantity(item.ean, newQty);
                                } else {
                                  onRemoveItem(item.ean);
                                }
                                setEditingQuantity(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newQty = parseInt(tempQuantity) || 0;
                                  if (newQty > 0) {
                                    onUpdateQuantity(item.ean, newQty);
                                  } else {
                                    onRemoveItem(item.ean);
                                  }
                                  setEditingQuantity(null);
                                }
                              }}
                              className="w-12 h-8 px-2 text-sm font-medium text-center border-0 outline-none"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingQuantity(item.ean);
                                setTempQuantity(item.quantity.toString());
                              }}
                              className="px-3 py-1 text-sm font-medium hover:bg-gray-50 min-w-[3rem] h-8"
                            >
                              {item.quantity}
                            </button>
                          )}
                          <button
                            onClick={() => onUpdateQuantity(item.ean, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="col-span-3 text-center text-sm font-medium">{formatSpanishCurrency(totalWithTax)}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Totals Summary */}
              <div className="bg-gray-50 border-t p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (Base):</span>
                    <span>{formatSpanishCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA:</span>
                    <span>{formatSpanishCurrency(taxTotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatSpanishCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="border-t bg-white mt-auto">
          {/* Barcode Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="barcode-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeInput}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500"
                placeholder="Añadir producto por EAN"
              />
            </div>
            
            {/* Error message only for product not found */}
            {barcodeMessage && barcodeMessage.startsWith('✗') && (
              <div className="mt-2 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                {barcodeMessage}
              </div>
            )}
          </div>

          
          {/* Checkout Button */}
          {items.length > 0 && (
            <div className="p-4">
              <Button
                onClick={onCheckout}
                className="w-full bg-green-500 text-white py-4 rounded-lg font-medium text-lg hover:bg-green-600"
              >
                Confirmar orden ({formatSpanishCurrency(total)})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
