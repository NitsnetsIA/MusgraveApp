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
          const { query } = await import('../lib/database');
          const processedOrders = query(`SELECT * FROM orders WHERE source_purchase_order_id = '${orderData.purchase_order_id}'`);
          if (processedOrders.length > 0) {
            setProcessedOrder(processedOrders[0]);
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
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
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
      </div>

      <div className="p-4">
        {/* Order Header */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold mb-1">
            Orden de compra: {order.purchase_order_id?.substring(0, 7)}
          </h1>
          <div className="text-sm text-gray-600 mb-2">
            <div>Tienda: {store?.name || store?.code || 'Cargando...'}</div>
            <div>Centro de entrega: {store?.delivery_center_name || 'M-005 - Centro de entrega Alicante-Elche'}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            {order.status === 'completed' && processedOrder && (
              <button 
                onClick={() => setLocation(`/orders/${processedOrder.order_id}`)}
                className="text-blue-600 underline"
              >
                Pedido asociado: {processedOrder.order_id.substring(0, 6)}
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-100 px-3 py-2 border-b grid grid-cols-12 gap-1 text-xs font-medium text-gray-700">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2 text-center">Uds</div>
            <div className="col-span-2 text-center">Base</div>
            <div className="col-span-2 text-center">IVA</div>
            <div className="col-span-2 text-center">Importe</div>
          </div>

          {/* Products */}
          {order.items && order.items.length > 0 ? (
            <div className="divide-y">
              {order.items.map((item: any, index: number) => {
                const baseTotal = item.base_price_at_order * item.quantity;
                const taxAmount = baseTotal * item.tax_rate_at_order;
                const totalWithTax = baseTotal + taxAmount;
                
                return (
                  <div key={index} className="px-3 py-3 grid grid-cols-12 gap-1 items-center">
                    {/* Product */}
                    <div className="col-span-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                        <div className="w-5 h-6 bg-blue-400 rounded-sm"></div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">{item.title}</div>
                        <div className="text-xs text-gray-500">EAN: {item.item_ean}</div>
                      </div>
                    </div>
                    
                    {/* Units */}
                    <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                    
                    {/* Base Price */}
                    <div className="col-span-2 text-center text-sm">{formatSpanishCurrency(item.base_price_at_order)}</div>
                    
                    {/* VAT */}
                    <div className="col-span-2 text-center text-sm">
                      <div>{formatSpanishCurrency(taxAmount)}</div>
                      <div className="text-xs text-gray-500">({(item.tax_rate_at_order * 100).toFixed(0)}%)</div>
                    </div>
                    
                    {/* Total */}
                    <div className="col-span-2 text-center text-sm font-medium">{formatSpanishCurrency(totalWithTax)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
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