import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { CheckCircle, ClipboardList, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderConfirmation() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/order-confirmation/:orderId');
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    if (params?.orderId) {
      setOrderNumber(params.orderId);
    }
  }, [params?.orderId]);

  const handleViewOrder = () => {
    setLocation(`/purchase-orders/${orderNumber}`);
  };

  const handleViewAllOrders = () => {
    setLocation('/purchase-orders');
  };

  const handleContinueShopping = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          <span className="font-medium">Orden realizada</span>
        </div>
      </div>

      <div className="p-4">
        {/* Success Message */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm text-center">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Orden #{orderNumber} realizada
            </h1>
          </div>
          
          <p className="text-gray-600 mb-4">
            Se ha completado correctamente tu orden.
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Le informaremos de la confirmación definitiva y si es necesario algún cambio de productos lo antes posible, vía email y por la aplicación.
          </p>

          {/* Warehouse Image Placeholder */}
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-8 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Centro Musgrave</p>
                <p className="text-sm text-gray-600">Procesando tu pedido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Puedes ver tu orden compra aquí:
          </div>
          <Button
            onClick={handleViewOrder}
            variant="outline"
            className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Orden nº #{orderNumber}
          </Button>

          <div className="text-sm font-medium text-gray-700 mb-2 mt-6">
            Puedes ver todas tus ordenes de compra aquí:
          </div>
          <Button
            onClick={handleViewAllOrders}
            variant="outline"
            className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Todas tus ordenes de compra
          </Button>

          <div className="text-sm font-medium text-gray-700 mb-2 mt-6">
            Puedes seguir comprando aquí:
          </div>
          <Button
            onClick={handleContinueShopping}
            variant="outline"
            className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ir al catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}