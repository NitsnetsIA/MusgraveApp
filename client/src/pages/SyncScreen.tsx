import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { checkSynchronizationNeeds } from '../lib/sync-service';
import { performPureIndexedDBSync as performIndexedDBSync } from '../lib/sync-service-pure-indexeddb';
import { DatabaseService } from '../lib/indexeddb';

interface SyncStep {
  id: string;
  label: string;
  completed: boolean;
}

interface SyncScreenProps {
  onSyncComplete: () => void;
  selectedEntities?: string[];
  user?: any; // The authenticated user object with store_id
}

export default function SyncScreen({ onSyncComplete, selectedEntities = ['taxes', 'products', 'deliveryCenters', 'stores', 'users'], user }: SyncScreenProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [syncSteps, setSyncSteps] = useState<SyncStep[]>([]);
  const [currentMessage, setCurrentMessage] = useState('Iniciando sincronización...');
  const [useIndexedDB, setUseIndexedDB] = useState(false);
  const [showChoice, setShowChoice] = useState(true);

  const handleIndexedDBSync = async () => {
    try {
      setShowChoice(false);
      setCurrentMessage('🚀 Iniciando sincronización con IndexedDB...');
      setProgress(10);

      await performIndexedDBSync();
      
      setProgress(100);
      setCurrentMessage('✅ Sincronización IndexedDB completada exitosamente');
      
      setTimeout(() => {
        onSyncComplete();
      }, 1500);
    } catch (error) {
      console.error('IndexedDB sync failed:', error);
      setCurrentMessage('❌ Error en sincronización IndexedDB: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleLegacySync = () => {
    setShowChoice(false);
    setUseIndexedDB(false);
    performLegacySync();
  };

  useEffect(() => {
    // Don't auto-start sync, let user choose
  }, []);

  const performLegacySync = async () => {
      try {
        // Step 1: Check what needs to be synced
        setCurrentMessage('Conectando con servidor...');
        setProgress(5);
        
        const startTime = Date.now();
        const syncResults = await checkSynchronizationNeeds(user?.store_id);
        const elapsedTime = Date.now() - startTime;
        
        console.log('Using store_id for sync:', user?.store_id);
        
        console.log(`Sync check completed in ${elapsedTime}ms`);
        
        // Filter by selected entities and needs_sync
        const entitiesToSync = syncResults.filter(entity => 
          entity.needs_sync && 
          (selectedEntities.includes(entity.entity_name) ||
           (entity.entity_name === 'deliveryCenters' && selectedEntities.includes('deliveryCenters')) ||
           (entity.entity_name === 'delivery_centers' && selectedEntities.includes('deliveryCenters')))
        );
        
        console.log('Selected entities:', selectedEntities);
        console.log('Entities that need sync:', entitiesToSync.map(e => e.entity_name));
        
        // Build steps based on what needs syncing
        const steps: SyncStep[] = [];
        
        // Order matters: taxes → products → delivery_centers → stores → users
        if (entitiesToSync.find(e => e.entity_name === 'taxes') && selectedEntities.includes('taxes')) {
          steps.push({ id: 'taxes', label: 'Sincronizando Impuestos', completed: false });
        }
        
        if (entitiesToSync.find(e => e.entity_name === 'products') && selectedEntities.includes('products')) {
          steps.push({ id: 'products', label: 'Sincronizando Productos', completed: false });
        }
        
        if ((entitiesToSync.find(e => e.entity_name === 'delivery_centers') || entitiesToSync.find(e => e.entity_name === 'deliveryCenters')) && selectedEntities.includes('deliveryCenters')) {
          steps.push({ id: 'deliveryCenters', label: 'Sincronizando Centros de Entrega', completed: false });
        }
        
        if (entitiesToSync.find(e => e.entity_name === 'stores') && selectedEntities.includes('stores')) {
          steps.push({ id: 'stores', label: 'Sincronizando Tiendas', completed: false });
        }
        
        if (entitiesToSync.find(e => e.entity_name === 'users') && selectedEntities.includes('users')) {
          steps.push({ id: 'users', label: 'Sincronizando Usuarios', completed: false });
        }
        
        setSyncSteps(steps);
        
        if (steps.length === 0) {
          // Nothing to sync
          setProgress(100);
          setCurrentMessage('Sincronización completada');
          setTimeout(() => {
            onSyncComplete();
          }, 1000);
          return;
        }
        
        // Step 2: Sync each entity
        const progressPerStep = 80 / steps.length; // Reserve 10% for initial check, 10% for completion
        let currentProgress = 20;
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          setCurrentStep(i);
          setCurrentMessage(step.label);
          
          let syncSuccess = false;
          
          // Perform actual sync based on entity type
          if (step.id === 'users') {
            const { syncUsers } = await import('../lib/sync-service');
            syncSuccess = await syncUsers((message, entityProgress) => {
              setCurrentMessage(message);
              // Map entity progress to overall progress within this step
              const stepProgress = currentProgress + (progressPerStep * entityProgress / 100);
              setProgress(Math.min(stepProgress, 90));
            }, user?.store_id);
          } else if (step.id === 'taxes') {
            const { syncTaxes } = await import('../lib/sync-service');
            syncSuccess = await syncTaxes((message, entityProgress) => {
              setCurrentMessage(message);
              // Map entity progress to overall progress within this step
              const stepProgress = currentProgress + (progressPerStep * entityProgress / 100);
              setProgress(Math.min(stepProgress, 90));
            }, user?.store_id);
          } else if (step.id === 'products') {
            const { syncProducts } = await import('../lib/sync-service');
            syncSuccess = await syncProducts((message, entityProgress) => {
              setCurrentMessage(message);
              // Map entity progress to overall progress within this step
              const stepProgress = currentProgress + (progressPerStep * entityProgress / 100);
              setProgress(Math.min(stepProgress, 90));
            }, user?.store_id);
          } else if (step.id === 'stores') {
            const { syncStores } = await import('../lib/sync-service');
            syncSuccess = await syncStores((message, entityProgress) => {
              setCurrentMessage(message);
              // Map entity progress to overall progress within this step
              const stepProgress = currentProgress + (progressPerStep * entityProgress / 100);
              setProgress(Math.min(stepProgress, 90));
            }, user?.store_id);
          } else if (step.id === 'deliveryCenters') {
            const { syncDeliveryCenters } = await import('../lib/sync-service');
            syncSuccess = await syncDeliveryCenters((message, entityProgress) => {
              setCurrentMessage(message);
              // Map entity progress to overall progress within this step
              const stepProgress = currentProgress + (progressPerStep * entityProgress / 100);
              setProgress(Math.min(stepProgress, 90));
            }, user?.store_id);
          }
          
          if (syncSuccess) {
            // Mark step as completed
            setSyncSteps(prev => prev.map((s, idx) => 
              idx === i ? { ...s, completed: true } : s
            ));
            
            currentProgress += progressPerStep;
            setProgress(Math.min(currentProgress, 90));
          } else {
            console.error(`Failed to sync ${step.id}`);
            // Continue with other entities even if one fails
            currentProgress += progressPerStep;
            setProgress(Math.min(currentProgress, 90));
          }
        }
        
        // Step 3: Finalization
        setProgress(100);
        setCurrentMessage('Sincronización completada');
        
        setTimeout(() => {
          onSyncComplete();
        }, 1000);
        
      } catch (error) {
        console.error('Sync error:', error);
        setCurrentMessage('Error en la sincronización');
        setProgress(100);
        // Still complete after error to not block the user
        setTimeout(() => {
          onSyncComplete();
        }, 2000);
      }
    };

  // Show sync method selection
  if (showChoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-center mb-6">Selecciona Método de Sincronización</h2>
          
          <div className="space-y-4">
            <Button
              onClick={handleIndexedDBSync}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="lg"
            >
              🚀 IndexedDB (Recomendado)
              <span className="block text-sm opacity-90">Sin límites de capacidad</span>
            </Button>
            
            <Button
              onClick={handleLegacySync}
              variant="outline"
              className="w-full"
              size="lg"
            >
              📦 Sistema Original (SQL.js)
              <span className="block text-sm opacity-70">Limitado a ~5MB</span>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            IndexedDB puede manejar los 9,000 productos sin problemas de capacidad
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with user info and logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">LR</span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Luis Romero Pérez</div>
            <div className="text-gray-500">(ES Gran VIA)</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Musgrave logo */}
          <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
            M
          </div>
          {/* Cart icon */}
          <div className="relative">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m.6 8l-1 5h12m-10-5v0m8 0v0m-8 5v0m8-5v0" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main sync content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Musgrave branding area */}
        <div className="w-80 h-80 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center shadow-sm">
          <div className="text-6xl font-script text-gray-800 transform -rotate-12">
            Musgrave
          </div>
        </div>

        {/* Progress section */}
        <div className="w-full max-w-sm space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="w-full h-3 bg-gray-200"
              data-testid="sync-progress-bar"
            />
            <div className="text-center text-sm font-medium text-gray-700" data-testid="sync-status-message">
              {currentMessage}
            </div>
          </div>

          {/* Sync steps debug info (only show in development) */}
          {process.env.NODE_ENV === 'development' && syncSteps.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-xs text-gray-500 text-center">Debug - Pasos de sincronización:</div>
              {syncSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`text-xs px-2 py-1 rounded text-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-700' 
                      : index === currentStep 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.completed ? '✓' : index === currentStep ? '⏳' : '⏸'} {step.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}