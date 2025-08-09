import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { performFullSync } from '../lib/sync-service-indexeddb';

interface SyncScreenProps {
  onSyncComplete: () => void;
}

export default function SyncScreenSimple({ onSyncComplete }: SyncScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleIndexedDBSync = async () => {
    setIsLoading(true);
    setProgress(0);
    setError('');
    setSuccess(false);
    
    try {
      setMessage('🚀 Iniciando sincronización con IndexedDB...');
      setProgress(10);

      // Use the new IndexedDB sync service
      await performFullSync();
      
      setProgress(100);
      setMessage('✅ Sincronización completada exitosamente');
      setSuccess(true);
      
      setTimeout(() => {
        onSyncComplete();
      }, 1500);
    } catch (err) {
      console.error('IndexedDB sync failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error en sincronización: ${errorMessage}`);
      setMessage('❌ Error en la sincronización');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : error ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Database className="h-6 w-6" />
            )}
            Sincronización de Datos
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Current Message */}
          {message && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleIndexedDBSync}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="lg"
              data-testid="button-sync-indexeddb"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isLoading ? 'Sincronizando con IndexedDB...' : 'Sincronizar con IndexedDB (Recomendado)'}
            </Button>

            {success && (
              <Button
                onClick={onSyncComplete}
                className="w-full"
                size="lg"
                data-testid="button-continue"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continuar al Catálogo
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              IndexedDB maneja grandes cantidades de datos sin problemas de capacidad
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}