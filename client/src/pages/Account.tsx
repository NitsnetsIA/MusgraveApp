import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, User, Database, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseService } from '@/lib/database-service';
import { imageCacheService } from '@/lib/image-cache-service';

interface AccountProps {
  user?: any;
  store?: any;
  deliveryCenter?: any;
}

export default function Account({ user, store, deliveryCenter }: AccountProps) {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<{
    productCount: number;
    totalImageCount: number;
    cachedImageCount: number;
    purchaseOrderCount: number;
    completedOrderCount: number;
    loading: boolean;
  }>({
    productCount: 0,
    totalImageCount: 0,
    cachedImageCount: 0,
    purchaseOrderCount: 0,
    completedOrderCount: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
    
    // Update only image stats in real-time when image cache progress changes
    const handleProgress = async () => {
      try {
        console.log('Account: Image progress update detected');
        const cachedImageCount = await imageCacheService.getCachedImageCount();
        console.log('Account: Updated cached image count:', cachedImageCount);
        setStats(prev => ({ ...prev, cachedImageCount }));
      } catch (error) {
        console.error('Error updating image count:', error);
      }
    };
    
    const handleProgressEvent = (progress: any) => {
      console.log('Account: Progress event received:', progress);
      handleProgress();
    };
    
    imageCacheService.addProgressListener(handleProgressEvent);
    
    return () => {
      imageCacheService.removeProgressListener(handleProgressEvent);
    };
  }, []);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Get product count - use getProducts without searchTerm to get all active products
      const products = await DatabaseService.getProducts();
      const productCount = products.length;
      
      // Count total images for active products (product images + nutrition labels)
      let totalImageCount = 0;
      products.forEach(p => {
        if (p.is_active) {
          if (p.image_url && p.image_url.trim() !== '') totalImageCount++;
          if (p.nutrition_label_url && p.nutrition_label_url.trim() !== '') totalImageCount++;
        }
      });

      // Get cached image count
      const cachedImageCount = await imageCacheService.getCachedImageCount();

      // Get purchase order count - pass empty string to get all
      const purchaseOrders = await DatabaseService.getPurchaseOrdersForUser('');
      const purchaseOrderCount = purchaseOrders.length;

      // Get completed orders count - pass empty string to get all
      const orders = await DatabaseService.getOrdersForUser('');
      const completedOrderCount = orders.length;

      console.log('Stats loaded:', {
        totalProducts: productCount,
        totalImageCount,
        cachedImageCount,
        purchaseOrderCount,
        completedOrderCount
      });

      setStats({
        productCount, // Total number of products
        totalImageCount, // Total images for progress calculation
        cachedImageCount,
        purchaseOrderCount,
        completedOrderCount,
        loading: false
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
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

        {/* Downloaded Data Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-medium text-gray-900 mb-3 border-b pb-2 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Datos descargados
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Productos:</span>
              <span className="font-medium">
                {stats.loading ? '...' : stats.productCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Imágenes (prod. + nutric.):</span>
              <span className="font-medium">
                {stats.loading ? '...' : `${stats.cachedImageCount}/${stats.totalImageCount}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Órdenes de compra:</span>
              <span className="font-medium">
                {stats.loading ? '...' : stats.purchaseOrderCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pedidos completados:</span>
              <span className="font-medium">
                {stats.loading ? '...' : stats.completedOrderCount}
              </span>
            </div>
            {!stats.loading && stats.totalImageCount > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Progreso de imágenes:</span>
                  <span className="text-gray-500">
                    {Math.round((stats.cachedImageCount / stats.totalImageCount) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.round((stats.cachedImageCount / stats.totalImageCount) * 100)}%` }}
                  ></div>
                </div>
                {stats.cachedImageCount < stats.totalImageCount && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full text-xs"
                    onClick={async () => {
                      const { resumeImageCaching } = await import('@/lib/sync-service-pure-indexeddb');
                      resumeImageCaching();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Reanudar descarga
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
