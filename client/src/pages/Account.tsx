import { useLocation } from 'wouter';
import { ChevronLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccountProps {
  user?: any;
  store?: any;
  deliveryCenter?: any;
}

export default function Account({ user, store, deliveryCenter }: AccountProps) {
  const [, setLocation] = useLocation();

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
        <User className="h-5 w-5 mr-2" />
        <h1 className="text-xl font-bold">Mi cuenta</h1>
      </div>

      <div className="space-y-6">
        {/* User Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-medium text-gray-900 mb-3 border-b pb-2">Usuario</h2>
          <div className="space-y-3">
            <div className="flex">
              <span className="w-20 text-gray-600">Nombre:</span>
              <span className="font-medium">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-gray-600">Email:</span>
              <span className="font-medium">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Store Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-medium text-gray-900 mb-3 border-b pb-2">Tienda</h2>
          <div className="space-y-3">
            <div className="flex">
              <span className="w-20 text-gray-600">Código:</span>
              <span className="font-medium">{store?.code || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-gray-600">Nombre:</span>
              <span className="font-medium">{store?.name || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-gray-600">Email:</span>
              <span className="font-medium">{store?.responsible_email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Delivery Center Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-medium text-gray-900 mb-3 border-b pb-2">Centro Musgrave asociado</h2>
          <div className="space-y-3">
            <div className="flex">
              <span className="w-20 text-gray-600">Código:</span>
              <span className="font-medium">{deliveryCenter?.code || store?.delivery_center_code || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-gray-600">Nombre:</span>
              <span className="font-medium">{deliveryCenter?.name || store?.delivery_center_name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
