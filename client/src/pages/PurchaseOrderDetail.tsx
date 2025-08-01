import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';

export default function PurchaseOrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/purchase-orders/:id');
  const { getPurchaseOrderById } = useDatabase();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!params?.id) return;
      
      setIsLoading(true);
      const orderData = await getPurchaseOrderById(params.id);
      setOrder(orderData);
      setIsLoading(false);
    }

    loadOrder();
  }, [params?.id]); // Remove getPurchaseOrderById to prevent infinite loop

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500 mt-8">
          Orden no encontrada
        </div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uncommunicated':
        return 'Sin comunicar';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uncommunicated':
        return 'text-red-500';
      case 'processing':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/purchase-orders')}
          className="mr-3 p-0"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <ClipboardList className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Órdenes de compra</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">
          Orden de compra: {order.purchase_order_id.slice(-6)}
        </h2>
        <div className="text-sm text-gray-600 mb-1">
          Centro de entrega Musgrave: 122 - Dolores (Alicante)
        </div>
        <div className="flex items-center space-x-4">
          <span className={`font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          {order.status === 'completed' && (
            <span className="text-blue-600">Pedido asociado: 323232</span>
          )}
        </div>
      </div>

      {/* Product Details Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Producto</th>
                <th className="text-left p-3 font-medium">Uds</th>
                <th className="text-left p-3 font-medium">Base</th>
                <th className="text-left p-3 font-medium">IVA</th>
                <th className="text-left p-3 font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, index: number) => {
                const itemTotal = item.quantity * item.base_price_at_order;
                const itemTax = itemTotal * item.tax_rate_at_order;
                return (
                  <tr key={index} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
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
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-500">EAN:{item.item_ean}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{item.base_price_at_order.toFixed(2)}€</td>
                    <td className="p-3">
                      {itemTax.toFixed(2)}€
                      <br />
                      <span className="text-xs text-gray-500">
                        ({(item.tax_rate_at_order * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-3">{(itemTotal + itemTax).toFixed(2)}€</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Order Totals */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{order.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="font-medium">{order.tax_total.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{order.final_total.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
