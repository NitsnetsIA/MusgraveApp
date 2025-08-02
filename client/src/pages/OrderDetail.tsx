import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ChevronLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';
import { formatSpanishCurrency } from '@/lib/utils/currency';

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/orders/:id');
  const { getOrderById, getPurchaseOrderById } = useDatabase();
  const [order, setOrder] = useState<any>(null);
  const [originalPurchaseOrder, setOriginalPurchaseOrder] = useState<any>(null);
  const [modifications, setModifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate modifications between original purchase order and final order
  const calculateModifications = (originalItems: any[], finalItems: any[]) => {
    const modifications = [];
    
    // Check for modified or removed items
    originalItems.forEach(originalItem => {
      const finalItem = finalItems.find(item => item.item_ean === originalItem.item_ean);
      
      if (!finalItem) {
        // Item was removed
        modifications.push({
          ean: originalItem.item_ean,
          title: originalItem.title,
          type: 'removed',
          originalQuantity: originalItem.quantity,
          finalQuantity: 0,
          originalPrice: originalItem.base_price_at_order,
          finalPrice: originalItem.base_price_at_order
        });
      } else if (finalItem.quantity !== originalItem.quantity || finalItem.base_price_at_order !== originalItem.base_price_at_order) {
        // Item was modified
        modifications.push({
          ean: originalItem.item_ean,
          title: originalItem.title,
          type: 'modified',
          originalQuantity: originalItem.quantity,
          finalQuantity: finalItem.quantity,
          originalPrice: originalItem.base_price_at_order,
          finalPrice: finalItem.base_price_at_order
        });
      }
    });
    
    // Check for added items
    finalItems.forEach(finalItem => {
      const originalItem = originalItems.find(item => item.item_ean === finalItem.item_ean);
      if (!originalItem) {
        modifications.push({
          ean: finalItem.item_ean,
          title: finalItem.title,
          type: 'added',
          originalQuantity: 0,
          finalQuantity: finalItem.quantity,
          originalPrice: finalItem.base_price_at_order,
          finalPrice: finalItem.base_price_at_order
        });
      }
    });
    
    return modifications;
  };

  useEffect(() => {
    async function loadOrder() {
      if (!params?.id) return;
      
      setIsLoading(true);
      const orderData = await getOrderById(params.id);
      setOrder(orderData);
      
      // Load original purchase order if available
      if (orderData?.source_purchase_order_id) {
        const originalOrder = await getPurchaseOrderById(orderData.source_purchase_order_id);
        setOriginalPurchaseOrder(originalOrder);
        
        // Calculate modifications by comparing original and final orders
        if (originalOrder?.items && orderData?.items) {
          const mods = calculateModifications(originalOrder.items, orderData.items);
          setModifications(mods);
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
          Pedido no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/orders')}
          className="mr-3 p-0"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <Package className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Mis pedidos</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">
          Pedido: {order.order_id.slice(-6)}
        </h2>
        <div className="text-sm text-gray-600 mb-1">
          Orden de compra asociado: 
          <button 
            onClick={() => setLocation(`/purchase-orders/${order.source_purchase_order_id}`)}
            className="text-blue-600 ml-1 hover:underline"
          >
            {order.source_purchase_order_id.slice(-6)}
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Centro de entrega Musgrave: 122 - Dolores (Alicante)
        </div>
      </div>

      {/* Product Details Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
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
                    <td className="p-3">{formatSpanishCurrency(item.base_price_at_order)}</td>
                    <td className="p-3">
                      {formatSpanishCurrency(itemTax)}
                      <br />
                      <span className="text-xs text-gray-500">
                        ({(item.tax_rate_at_order * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-3">{formatSpanishCurrency(itemTotal + itemTax)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Order Totals - Recalculated from actual items */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatSpanishCurrency(
                order.items?.reduce((sum: number, item: any) => 
                  sum + (item.quantity * item.base_price_at_order), 0) || 0
              )}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="font-medium">{formatSpanishCurrency(
                order.items?.reduce((sum: number, item: any) => 
                  sum + (item.quantity * item.base_price_at_order * item.tax_rate_at_order), 0) || 0
              )}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatSpanishCurrency(
                order.items?.reduce((sum: number, item: any) => 
                  sum + (item.quantity * item.base_price_at_order * (1 + item.tax_rate_at_order)), 0) || 0
              )}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modifications */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Modificaciones efectuadas sobre la orden de compra</h3>
        </div>
        
        {modifications.length === 0 ? (
          <div className="p-4 text-center text-gray-600">
            ✓ Sin cambios respecto a la orden de compra
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium">Modificación</th>
                </tr>
              </thead>
              <tbody>
                {modifications.map((mod, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            IMG
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{mod.title}</div>
                          <div className="text-xs text-gray-500">EAN:{mod.ean}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {mod.type === 'removed' && (
                        <div>
                          <div className="text-red-600 font-medium">Cantidad modificada:</div>
                          <div className="text-sm">De {mod.originalQuantity} a 0</div>
                        </div>
                      )}
                      {mod.type === 'added' && (
                        <div>
                          <div className="text-green-600 font-medium">Producto añadido:</div>
                          <div className="text-sm">Cantidad: {mod.finalQuantity}</div>
                        </div>
                      )}
                      {mod.type === 'modified' && (
                        <div>
                          {mod.originalQuantity !== mod.finalQuantity && (
                            <div>
                              <div className="text-blue-600 font-medium">Cantidad modificada:</div>
                              <div className="text-sm">De {mod.originalQuantity} a {mod.finalQuantity}</div>
                            </div>
                          )}
                          {mod.originalPrice !== mod.finalPrice && (
                            <div className={mod.originalQuantity !== mod.finalQuantity ? "mt-1" : ""}>
                              <div className="text-blue-600 font-medium">Precio modificado:</div>
                              <div className="text-sm">De {mod.originalPrice.toFixed(2).replace('.', ',')}€ a {mod.finalPrice.toFixed(2).replace('.', ',')}€</div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Observations */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-bold text-lg mb-3">Observaciones:</h3>
        <p className="text-sm text-gray-700">
          {modifications.length > 0 
            ? "Se han producido cambios sobre su orden de compra. Si tiene cualquier problema póngase en contacto con Musgrave"
            : order.observations || "Sin observaciones"
          }
        </p>
      </div>
    </div>
  );
}