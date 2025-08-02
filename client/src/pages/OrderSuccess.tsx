import { useLocation } from 'wouter';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSuccessProps {
  orderId?: string;
}

export default function OrderSuccess({ orderId }: OrderSuccessProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="p-4 text-center">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Orden #{orderId || '123555'} realizada
        </h1>
        <p className="text-gray-600 mb-4">
          Hemos recibido correctamente tu pedido. Va a ser procesado por nuestro equipo.
        </p>
        <p className="text-gray-600 mb-6">
          Le informaremos de la confirmación definitiva y si es necesario algún cambio de productos en el pedido lo antes posible, vía email y por la aplicación.
        </p>
      </div>

      {/* Warehouse workers processing order image placeholder */}
      <div className="w-full h-48 bg-gray-200 rounded-xl shadow-lg mb-6 flex items-center justify-center">
        <span className="text-gray-500">Imagen de almacén</span>
      </div>

      <p className="text-gray-700 mb-6">Puedes ver el estado de tu pedidos aquí:</p>
      
      <Button
        onClick={() => setLocation('/orders')}
        variant="outline"
        className="border-gray-300 mb-6 flex items-center mx-auto"
      >
        <FileText className="h-4 w-4 mr-2" />
        Todos los pedidos
      </Button>

      <Button
        variant="ghost"
        onClick={() => setLocation('/')}
        className="flex items-center text-gray-600 mx-auto"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        VOLVER
      </Button>
    </div>
  );
}
