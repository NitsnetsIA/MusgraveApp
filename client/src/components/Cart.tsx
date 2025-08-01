import { X, Minus, Plus, Trash2 } from 'lucide-react';

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
      <div className="bg-white h-full w-full md:w-96 md:ml-auto flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Carrito de compras</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Su carrito está vacío
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.ean} className="flex items-center space-x-3 py-3 border-b">
                  <div className="w-15 h-15 bg-gray-100 rounded flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.title}</h3>
                    <div className="text-sm text-gray-500">{item.base_price.toFixed(2)} €/unidad</div>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => onUpdateQuantity(item.ean, Math.max(0, item.quantity - 1))}
                        className="bg-gray-200 text-gray-600 w-6 h-6 rounded flex items-center justify-center text-sm"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.ean, item.quantity + 1)}
                        className="bg-gray-200 text-gray-600 w-6 h-6 rounded flex items-center justify-center text-sm"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{(item.base_price * item.quantity).toFixed(2)} €</div>
                    <button
                      onClick={() => onRemoveItem(item.ean)}
                      className="text-red-500 text-sm mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA:</span>
                <span>{taxTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-musgrave-500 text-white py-3 rounded-lg font-medium hover:bg-musgrave-600"
            >
              Realizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
