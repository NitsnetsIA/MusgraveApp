import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2, Database, RefreshCw } from 'lucide-react';
import { performFullSync, checkSyncStatus } from '../lib/sync-service-indexeddb';
import { DatabaseService } from '../lib/indexeddb';
import { useDatabaseStats } from '../hooks/use-indexeddb';

interface SyncScreenProps {
  onSyncComplete: () => void;
}

export default function SyncScreenIndexedDB({ onSyncComplete }: SyncScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [syncResults, setSyncResults] = useState<{
    success: boolean;
    error?: string;
    entitiesToSync?: Array<{
      entity: string;
      totalRecords: number;
      lastUpdated: string;
    }>;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { stats, loadStats } = useDatabaseStats();

  const performSync = async () => {
    setIsLoading(true);
    setProgress(0);
    setSyncResults(null);
    setCurrentMessage('Verificando estado de sincronización...');

    try {
      // Step 1: Check sync status
      setProgress(10);
      const { entitiesToSync } = await checkSyncStatus();
      
      if (entitiesToSync.length === 0) {
        setCurrentMessage('✅ Todos los datos están actualizados');
        setSyncResults({ 
          success: true, 
          entitiesToSync: [] 
        });
        setProgress(100);
        await loadStats();
        return;
      }

      setCurrentMessage(`Sincronizando ${entitiesToSync.length} entidades...`);
      setProgress(20);

      // Step 2: Perform full sync
      await performFullSync();
      
      setProgress(90);
      setCurrentMessage('Actualizando estadísticas...');
      
      // Step 3: Load updated stats
      await loadStats();
      
      setProgress(100);
      setCurrentMessage('✅ Sincronización completada exitosamente');
      setSyncResults({ 
        success: true, 
        entitiesToSync 
      });

    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setCurrentMessage(`❌ Error: ${errorMessage}`);
      setSyncResults({ 
        success: false, 
        error: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar todos los datos locales e imágenes?')) {
      return;
    }

    try {
      setIsLoading(true);
      setCurrentMessage('Borrando base de datos...');
      setProgress(25);
      
      await DatabaseService.clearDatabase();
      
      setCurrentMessage('Borrando caché de imágenes...');
      setProgress(50);
      
      // Also clear image cache from Service Worker
      const { imageCacheService } = await import('@/lib/image-cache-service');
      await imageCacheService.clearImageCache();
      
      await loadStats();
      
      setCurrentMessage('✅ Base de datos e imágenes borradas');
      setSyncResults(null);
      setProgress(100);
      
      // Reset progress after 2 seconds
      setTimeout(() => setProgress(0), 2000);
    } catch (error) {
      console.error('Clear database and cache failed:', error);
      setCurrentMessage('❌ Error al borrar la base de datos e imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync on mount
  useEffect(() => {
    performSync();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (syncResults?.success) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (syncResults && !syncResults.success) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Database className="h-5 w-5" />;
  };

  const getProgressColor = () => {
    if (syncResults?.success) return "bg-green-600";
    if (syncResults && !syncResults.success) return "bg-red-600";
    return "bg-blue-600";
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Sincronización de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="w-full"
              style={{
                '--progress-foreground': getProgressColor()
              } as React.CSSProperties}
            />
          </div>

          {/* Current Message */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentMessage || 'Preparando sincronización...'}
            </p>
          </div>

          {/* Sync Results */}
          {syncResults && (
            <div className={`p-4 rounded-lg border ${
              syncResults.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {syncResults.success ? (
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Sincronización Exitosa
                  </h3>
                  {syncResults.entitiesToSync && syncResults.entitiesToSync.length > 0 ? (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Se sincronizaron {syncResults.entitiesToSync.length} entidades con el servidor.
                    </p>
                  ) : (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Todos los datos ya estaban actualizados.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Error de Sincronización
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {syncResults.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Database Statistics */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Estadísticas de la Base de Datos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <div className="font-semibold text-blue-800 dark:text-blue-200">Productos</div>
                  <div className="text-blue-600 dark:text-blue-400">
                    {stats.active_products} activos / {stats.products} total
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <div className="font-semibold text-green-800 dark:text-green-200">Tiendas</div>
                  <div className="text-green-600 dark:text-green-400">{stats.stores}</div>
                </div>
              </div>

              {showDetails && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                    <div className="font-semibold">Taxes</div>
                    <div className="text-gray-600 dark:text-gray-400">{stats.taxes}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                    <div className="font-semibold">Centros</div>
                    <div className="text-gray-600 dark:text-gray-400">{stats.delivery_centers}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                    <div className="font-semibold">Usuarios</div>
                    <div className="text-gray-600 dark:text-gray-400">{stats.users}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                    <div className="font-semibold">Órdenes Compra</div>
                    <div className="text-gray-600 dark:text-gray-400">{stats.purchase_orders}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                    <div className="font-semibold">Órdenes</div>
                    <div className="text-gray-600 dark:text-gray-400">{stats.orders}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={performSync}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-sync"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Sincronizando...' : 'Sincronizar Datos'}
            </Button>
            
            <Button
              onClick={clearDatabase}
              disabled={isLoading}
              variant="outline"
              data-testid="button-clear-database"
            >
              <Database className="h-4 w-4 mr-2" />
              Borrar Base de Datos
            </Button>
          </div>

          {/* Continue Button */}
          {syncResults?.success && (
            <Button
              onClick={onSyncComplete}
              className="w-full"
              size="lg"
              data-testid="button-continue"
            >
              Continuar al Catálogo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}