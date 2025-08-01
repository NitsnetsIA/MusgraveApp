import { useLocation } from 'wouter';
import { User, ClipboardList, Package, LogOut, X } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  store?: any;
  onLogout: () => void;
}

export default function SideMenu({ isOpen, onClose, user, store, onLogout }: SideMenuProps) {
  const [, setLocation] = useLocation();

  const navigateTo = (path: string) => {
    setLocation(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white w-80 h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-gray-600" />
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{store?.name}</div>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => navigateTo('/purchase-orders')}
                className="flex items-center justify-between w-full text-left py-3 border-b"
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="h-5 w-5" />
                  <span>Órdenes de compra</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('/orders')}
                className="flex items-center justify-between w-full text-left py-3 border-b"
              >
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5" />
                  <span>Mis pedidos</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('/account')}
                className="flex items-center justify-between w-full text-left py-3 border-b"
              >
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <span>Mi cuenta</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </li>
            <li>
              <button
                onClick={onLogout}
                className="flex items-center space-x-3 text-red-500 py-3"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar sesión</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
