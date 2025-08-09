import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';
import { formatSpanishCurrency } from '@/lib/utils/currency';

export default function PurchaseOrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/purchase-orders/:id');
  const { getPurchaseOrderById, getStoreByCode } = useDatabase();
  const [order, setOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [processedOrder, setProcessedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!params?.id) return;
      
      setIsLoading(true);
      const orderData = await getPurchaseOrderById(params.id);
      setOrder(orderData);
      
      // Load store data if order has store_id  
      if (orderData?.store_id) {
        const storeData = await getStoreByCode(orderData.store_id);
        setStore(storeData);
      }

      // If status is completed, try to find the associated processed order
      if (orderData?.status === 'completed') {
        try {
          const { UnifiedDatabaseService } = await import('@/lib/database-service');
          const processedOrders = await UnifiedDatabaseService.getOrdersForUser('');
          const matchingOrder = processedOrders.find(o => o.source_purchase_order_id === orderData.purchase_order_id);
          if (matchingOrder) {
            setProcessedOrder(matchingOrder);
          }
        } catch (error) {
          console.error('Error finding processed order:', error);
        }
      }
      
      setIsLoading(false);
    }

    loadOrder();
  }, [params?.id]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/purchase-orders')}
            className="mr-3 p-1"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <ClipboardList className="h-5 w-5 mr-2 text-gray-600" />
          <span className="font-medium">Órdenes de compra</span>
        </div>
      </div>

      <div className="p-4">
        {/* Order Header - Optimized Layout */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="mb-3">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Nº Orden: {order.purchase_order_id}
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Estado:</span>
              <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            {order.status === 'completed' && processedOrder && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Pedido asociado:</span>
                <button 
                  onClick={() => setLocation(`/orders/${processedOrder.order_id}`)}
                  className="text-sm text-blue-600 font-medium underline"
                >
                  {processedOrder.order_id}
                </button>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-600">
            <span className="inline-block mr-4">
              <span className="text-gray-600">Centro Musgrave:</span>
              <span className="font-medium ml-1">122 - Dolores (Alicante)</span>
            </span>
            <span className="inline-block">
              <span className="text-gray-600">Tienda:</span>
              <span className="font-medium ml-1">{store?.code || 'ES001'} - {store?.name || 'E.S. Gran VIA'}</span>
            </span>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-2 font-medium w-[45%]">Producto</th>
                  <th className="text-left p-2 font-medium w-[15%]">Uds</th>
                  <th className="text-left p-2 font-medium w-[20%]">
                    <div className="text-xs leading-tight">
                      <div>Base</div>
                      <div>IVA</div>
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium w-[20%]">Importe</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, index: number) => {
                  const itemTotal = item.quantity * item.base_price_at_order;
                  const itemTax = itemTotal * item.tax_rate_at_order;
                  return (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0">
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              IMG
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm leading-tight line-clamp-2" style={{lineHeight: "1.2", minHeight: "2.4em"}}>{item.title}</div>
                            <div className="text-xs text-gray-500">EAN:{item.item_ean}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2">
                        <div className="text-xs leading-none">
                          <div className="mb-0.5">{formatSpanishCurrency(item.base_price_at_order)}</div>
                          <div className="mb-0.5">{formatSpanishCurrency(item.base_price_at_order * item.tax_rate_at_order)}</div>
                          <div className="text-gray-500">{(item.tax_rate_at_order * 100).toFixed(0)}%</div>
                        </div>
                      </td>
                      <td className="p-2 text-right">{formatSpanishCurrency(itemTotal + itemTax)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!order.items || order.items.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No hay productos en esta orden
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="mt-4 bg-white rounded-lg border p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>{formatSpanishCurrency(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">IVA:</span>
              <span>{formatSpanishCurrency(order.tax_total || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatSpanishCurrency(order.final_total || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}