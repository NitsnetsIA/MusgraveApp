import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ClipboardList, Eye, Info, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

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



      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="w-full">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-2 font-medium w-[25%]">fecha</th>
                <th className="text-left p-2 font-medium w-[45%]">nº de orden</th>
                <th className="text-left p-2 font-medium w-[20%]">importe</th>
                <th className="text-left p-2 font-medium w-[10%]"></th>
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
                currentOrders.map((order) => {
                  const orderDate = new Date(order.created_at);
                  return (
                    <tr key={order.purchase_order_id} className="border-b">
                      <td className="p-2">
                        <div className="text-xs leading-tight">
                          <div>{orderDate.toLocaleDateString('es-ES')}</div>
                          <div className="text-gray-500">{orderDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="leading-tight">
                          <div className="font-medium text-xs break-all">{order.purchase_order_id}</div>
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
                      <td className="p-2 text-xs">
                        {formatSpanishCurrency(order.final_total)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewOrder(order.purchase_order_id)}
                          className="text-blue-600 p-1 flex-shrink-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls - Mobile-friendly */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          {/* First Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="p-2"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Counter */}
          <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded">
            {currentPage}/{totalPages}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
