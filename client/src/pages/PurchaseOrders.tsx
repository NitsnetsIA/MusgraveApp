import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ClipboardList, Eye, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDatabase } from '@/hooks/use-database';
import { formatSpanishCurrency } from '@/lib/utils/currency';

interface PurchaseOrdersProps {
  user?: any;
}

export default function PurchaseOrders({ user }: PurchaseOrdersProps) {
  const [, setLocation] = useLocation();
  const { getPurchaseOrders } = useDatabase();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) return;
      
      setIsLoading(true);
      const orderList = await getPurchaseOrders(user.email);
      setOrders(orderList);
      setCurrentPage(1); // Reset to first page when new data loads
      setIsLoading(false);
    }

    loadOrders();
  }, [user?.email]); // Remove getPurchaseOrders to prevent infinite loop

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uncommunicated':
        return 'Sin comunicar';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'uncommunicated':
        return 'La orden se comunicará a Musgrave cuando tenga conexión a internet';
      case 'processing':
        return 'La orden se está procesando en las instalaciones de Musgrave';
      case 'completed':
        return 'La orden ha sido aceptada, puede ver el pedido asociado';
      default:
        return '';
    }
  };

  const viewOrder = (orderId: string) => {
    setLocation(`/purchase-orders/${orderId}`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="mr-3 p-0"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </Button>
        <ClipboardList className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Órdenes de compra</h1>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
        La orden se comunicará a Musgrave cuando tenga conexión a internet
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">fecha</th>
                <th className="text-left p-3 font-medium">nº de orden</th>
                <th className="text-left p-3 font-medium">importe</th>
                <th className="text-left p-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No hay órdenes de compra
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order.purchase_order_id} className="border-b">
                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3">
                      <div className="leading-tight">
                        <div className="font-medium text-sm">{order.purchase_order_id.slice(-4)}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="text-sm">
                                  <strong>{getStatusText(order.status)}:</strong> {getStatusDescription(order.status)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {formatSpanishCurrency(order.final_total)}
                    </td>
                    <td className="p-3 w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrder(order.purchase_order_id)}
                        className="text-blue-600 p-1 flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orders.length > itemsPerPage && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1}-{Math.min(endIndex, orders.length)} de {orders.length} órdenes
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="text-sm"
              >
                &lt;&lt; primera
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-sm"
              >
                &lt; anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0 text-sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-sm"
              >
                siguiente &gt;
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="text-sm"
              >
                última &gt;&gt;
              </Button>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  // For now, we'll keep it at 30 as requested
                  // This is for future functionality
                }}
                className="ml-4 border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
