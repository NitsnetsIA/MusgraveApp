import { X, Minus, Plus, Trash2, Search } from 'lucide-react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onUpdateQuantity: (ean: string, quantity: number) => void;
  onRemoveItem: (ean: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.base_price * item.quantity * item.tax_rate), 0);
  const total = subtotal + taxTotal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-full w-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onClose}>
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por EAN, REF o Nombre"
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">Total: {total.toFixed(2).replace('.', ',')}€</div>
            <div className="text-sm text-gray-600">Centro de entrega Musgrave: 122 - Dolores (Alicante)</div>
          </div>
        </div>
        
        {/* Products Table */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 p-4">
              Su carrito está vacío
            </div>
          ) : (
            <div className="bg-white">
              {/* Table Header */}
              <div className="bg-gray-100 px-3 py-2 border-b grid grid-cols-12 gap-1 text-xs font-medium text-gray-700 sticky top-0">
                <div className="col-span-4">Producto</div>
                <div className="col-span-2 text-center">Unidades</div>
                <div className="col-span-2 text-center">Base</div>
                <div className="col-span-2 text-center">IVA</div>
                <div className="col-span-2 text-center">Importe</div>
              </div>

              {/* Products */}
              <div className="divide-y">
                {items.map((item) => {
                  const baseTotal = item.base_price * item.quantity;
                  const taxAmount = baseTotal * item.tax_rate;
                  const totalWithTax = baseTotal + taxAmount;
                  
                  return (
                    <div key={item.ean} className="px-3 py-3 grid grid-cols-12 gap-1 items-center">
                      {/* Product */}
                      <div className="col-span-4 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                          <div className="w-5 h-6 bg-blue-400 rounded-sm"></div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight">{item.title}</div>
                        </div>
                      </div>
                      
                      {/* Units with controls */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => onUpdateQuantity(item.ean, Math.max(0, item.quantity - 1))}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.ean, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Base Price */}
                      <div className="col-span-2 text-center text-sm">{item.base_price.toFixed(2).replace('.', ',')}€</div>
                      
                      {/* VAT */}
                      <div className="col-span-2 text-center text-sm">
                        <div>{taxAmount.toFixed(2).replace('.', ',')}€</div>
                        <div className="text-xs text-gray-500">({(item.tax_rate * 100).toFixed(0)}%)</div>
                      </div>
                      
                      {/* Total */}
                      <div className="col-span-2 text-center text-sm font-medium">{totalWithTax.toFixed(2).replace('.', ',')}€</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Totals and Checkout */}
        {items.length > 0 && (
          <div className="border-t bg-white">
            {/* Totals Summary */}
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>{subtotal.toFixed(2).replace('.', ',')}€</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">IVA:</span>
                <span>{taxTotal.toFixed(2).replace('.', ',')}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{total.toFixed(2).replace('.', ',')}€</span>
              </div>
            </div>
            
            {/* Checkout Button */}
            <div className="p-4">
              <button
                onClick={onCheckout}
                className="w-full bg-green-500 text-white py-4 rounded-lg font-medium text-lg hover:bg-green-600"
              >
                Confirmar orden ({total.toFixed(2).replace('.', ',')}€)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
