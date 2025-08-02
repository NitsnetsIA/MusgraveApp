import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Package, Eye } from 'lucide-react';
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

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) return;
      
      setIsLoading(true);
      const orderList = await getOrders(user.email);
      setOrders(orderList);
      setIsLoading(false);
    }

    loadOrders();
  }, [user?.email]); // Remove getOrders to prevent infinite loop

  const viewOrder = (orderId: string) => {
    setLocation(`/orders/${orderId}`);
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
        <Package className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Mis pedidos</h1>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">fecha</th>
                <th className="text-left p-3 font-medium">nº pedido</th>
                <th className="text-left p-3 font-medium">nº de orden</th>
                <th className="text-left p-3 font-medium">importe</th>
                <th className="text-left p-3 font-medium">detalle</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay pedidos
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id} className="border-b">
                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3">{order.order_id.slice(-4)}</td>
                    <td className="p-3">
                      <button className="text-blue-600">
                        {order.source_purchase_order_id}
                      </button>
                    </td>
                    <td className="p-3">{order.final_total.toFixed(2)}€</td>
                    <td className="p-3">
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
        
        {/* Pagination */}
        <div className="p-3 border-t bg-gray-50 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>&lt;&lt; first</span>
              <span>&lt; previous</span>
              <span className="font-medium">1 2 3 <span className="text-blue-600">4</span> 5 6</span>
              <span>next &gt;</span>
              <span>last &gt;&gt;</span>
            </div>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>30</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
