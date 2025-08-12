import { User, ShoppingCart } from 'lucide-react';
import { useLocation } from 'wouter';
import ImageCacheIndicator from '@/components/ImageCacheIndicator';

interface HeaderProps {
  user?: any;
  store?: any;
  isOffline: boolean;
  cartItemCount: number;
  onMenuToggle: () => void;
  onCartToggle: () => void;
}

export default function Header({
  user,
  store,
  isOffline,
  cartItemCount,
  onMenuToggle,
  onCartToggle
}: HeaderProps) {
  const [, setLocation] = useLocation();
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button onClick={onMenuToggle} className="text-gray-600">
            <User className="h-6 w-6" />
          </button>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-500">{store?.name || store?.code}</div>
          </div>
          <button 
            onClick={() => setLocation('/')}
            className="bg-musgrave-500 text-white text-lg font-bold px-2 py-1 rounded transform -rotate-12 hover:bg-musgrave-600 transition-colors"
          >
            M
          </button>
        </div>
        
        {/* Image Cache Progress Indicator - Center area */}
        <div className="flex-1 flex justify-center">
          <ImageCacheIndicator />
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onCartToggle} className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
