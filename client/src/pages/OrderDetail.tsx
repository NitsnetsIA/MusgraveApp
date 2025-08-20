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
          title: originalItem.item_title,
          item_ref: originalItem.item_ref,
          image_url: originalItem.image_url,
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
          title: originalItem.item_title,
          item_ref: originalItem.item_ref,
          image_url: originalItem.image_url,
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
          title: finalItem.item_title,
          item_ref: finalItem.item_ref,
          image_url: finalItem.image_url,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/orders')}
            className="mr-3 p-1"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <Package className="h-5 w-5 mr-2 text-gray-600" />
          <span className="font-medium">Mis pedidos</span>
        </div>
      </div>

      <div className="p-4">
        {/* Order Header - Optimized Layout */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="mb-3">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Nº Pedido: {order.order_id}
            </h1>
            {order.source_purchase_order_id && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Orden compra:</span>
                <button 
                  onClick={() => setLocation(`/purchase-orders/${order.source_purchase_order_id}`)}
                  className="text-sm text-blue-600 font-medium underline"
                >
                  {order.source_purchase_order_id}
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
              <span className="font-medium ml-1">ES001 - E.S. Gran VIA</span>
            </span>
          </div>
        </div>

      {/* Product Details Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
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
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.item_title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm leading-tight line-clamp-2" style={{lineHeight: "1.2", minHeight: "2.4em"}}>{item.item_title}</div>
                          <div className="text-xs text-gray-500">EAN:{item.item_ean}</div>
                          <div className="text-xs text-gray-500">REF:{item.item_ref || 'NO REF'}</div>
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
        
        {/* Order Totals */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatSpanishCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="font-medium">{formatSpanishCurrency(order.tax_total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatSpanishCurrency(order.final_total)}</span>
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
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {mod.image_url ? (
                            <img 
                              src={mod.image_url} 
                              alt={mod.title || "Producto"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500"
                            style={{ display: mod.image_url ? 'none' : 'flex' }}
                          >
                            IMG
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{mod.title}</div>
                          <div className="text-xs text-gray-500">EAN:{mod.ean}</div>
                          <div className="text-xs text-gray-500">REF:{mod.item_ref || 'NO REF'}</div>
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
        {order.observations && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-bold text-lg mb-3">Observaciones:</h3>
            <p className="text-sm text-gray-700">{order.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
}