import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Package, Eye, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';

interface OrdersProps {
  user?: any;
}

export default function Orders({ user }: OrdersProps) {
  const [, setLocation] = useLocation();
  const { getOrders } = useDatabase();
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
      const orderList = await getOrders(user.email);
      setOrders(orderList);
      setCurrentPage(1); // Reset to first page when new data loads
      setIsLoading(false);
    }

    loadOrders();
  }, [user?.email]); // Remove getOrders to prevent infinite loop

  const viewOrder = (orderId: string) => {
    setLocation(`/orders/${orderId}`);
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
        <Package className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Mis pedidos</h1>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-2 font-medium w-[25%]">Fecha</th>
              <th className="text-left p-2 font-medium w-[30%]">Nº Pedido</th>
              <th className="text-left p-2 font-medium w-[25%]">Importe</th>
              <th className="text-left p-2 font-medium w-[20%]">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Cargando pedidos...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No hay pedidos
                </td>
              </tr>
            ) : (
                currentOrders.map((order) => (
                  <tr key={order.order_id} className="border-b">
                    <td className="p-2 text-xs">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-2 text-xs">{order.order_id}</td>
                    <td className="p-2 text-xs">{order.final_total.toFixed(2)}€</td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrder(order.order_id)}
                        className="text-blue-600 p-1"
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
