import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ClipboardList, Eye, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';

interface PurchaseOrdersProps {
  user?: any;
}

export default function PurchaseOrders({ user }: PurchaseOrdersProps) {
  const [, setLocation] = useLocation();
  const { getPurchaseOrders } = useDatabase();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) return;
      
      setIsLoading(true);
      const orderList = await getPurchaseOrders(user.email);
      setOrders(orderList);
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
                <th className="text-left p-3 font-medium">nº orden</th>
                <th className="text-left p-3 font-medium">estado</th>
                <th className="text-left p-3 font-medium">importe</th>
                <th className="text-left p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay órdenes de compra
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.purchase_order_id} className="border-b">
                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3">{order.purchase_order_id.slice(-4)}</td>
                    <td className="p-3">
                      <span className={`font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {getStatusDescription(order.status)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Info className="h-4 w-4 text-gray-400 mr-1" />
                        {order.final_total.toFixed(2)}€
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrder(order.purchase_order_id)}
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
      </div>
    </div>
  );
}
