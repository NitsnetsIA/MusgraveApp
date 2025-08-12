import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { performPureIndexedDBSync as performIndexedDBSync } from '../lib/sync-service-pure-indexeddb';
import { DatabaseService } from '../lib/indexeddb';

interface SyncScreenProps {
  onSyncComplete: () => void;
  selectedEntities?: string[];
  user?: any; // The authenticated user object with store_id
}

export default function SyncScreen({ onSyncComplete, selectedEntities = ['taxes', 'products', 'deliveryCenters', 'stores', 'users'], user }: SyncScreenProps) {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Iniciando sincronización...');

  const handleIndexedDBSync = async () => {
    try {
      setCurrentMessage('🚀 Iniciando sincronización con IndexedDB...');
      setProgress(10);

      // Set up progress tracking with messages for each entity
      const onProgress = (message: string, progress: number) => {
        setCurrentMessage(message);
        setProgress(progress);
      };

      // Force full sync to reload all products
      await performIndexedDBSync(onProgress, true);
      
      setProgress(100);
      setCurrentMessage('✅ Sincronización IndexedDB completada exitosamente');
      
      setTimeout(() => {
        onSyncComplete();
      }, 1500);
    } catch (error) {
      console.error('IndexedDB sync failed:', error);
      setCurrentMessage('❌ Error en sincronización IndexedDB: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      
      // Still complete after error to not block the user
      setTimeout(() => {
        onSyncComplete();
      }, 3000);
    }
  };

  useEffect(() => {
    // Auto-start IndexedDB sync
    handleIndexedDBSync();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Musgrave Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-musgrave-500 text-white text-2xl font-bold px-4 py-2 rounded transform -rotate-12 mb-4">
            M
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Sincronizando Datos
          </h2>
        </div>
        
        {/* Progress */}
        <div className="space-y-4">
          <Progress value={progress} className="w-full h-2" />
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-300 min-h-[40px] flex items-center justify-center">
            {currentMessage}
          </div>
          
          <div className="text-center text-xs text-gray-400">
            {Math.round(progress)}% completado
          </div>
        </div>
        
        {/* Skip option (in case of errors) */}
        {progress === 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSyncComplete()}
              className="text-gray-500 hover:text-gray-700"
            >
              Saltar sincronización
            </Button>
          </div>
        )}
        
        {/* Manual refresh option */}
        {currentMessage.includes('Error') && (
          <div className="mt-6 text-center space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIndexedDBSync}
              className="mr-2"
            >
              Intentar de nuevo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSyncComplete()}
              className="text-gray-500 hover:text-gray-700"
            >
              Continuar sin sincronizar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}