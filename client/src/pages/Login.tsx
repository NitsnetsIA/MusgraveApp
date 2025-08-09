import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings } from 'lucide-react';
import { loginSchema, type LoginForm } from '@shared/schema';
import { clearDatabaseCompletely, resetDatabaseToEmpty, query } from '@/lib/database';

interface LoginProps {
  onLogin: (email: string, password: string, syncEntities?: string[], storageType?: 'sql' | 'indexeddb') => Promise<boolean>;
  isLoading?: boolean;
}

export default function Login({ onLogin, isLoading }: LoginProps) {
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [syncEntities, setSyncEntities] = useState({
    taxes: true,
    products: true,
    deliveryCenters: true,
    stores: true,
    users: true
  });
  const [storageType, setStorageType] = useState<'sql' | 'indexeddb'>('indexeddb');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'luis@esgranvia.es',
      password: 'password123'
    }
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('Form submitted with data:', data);
    setError('');
    try {
      const selectedEntities = Object.entries(syncEntities)
        .filter(([_, enabled]) => enabled)
        .map(([entity, _]) => entity);
      
      console.log('Selected sync entities:', selectedEntities);
      console.log('Selected storage type:', storageType);
      const success = await onLogin(data.email, data.password, selectedEntities, storageType);
      console.log('Login result:', success);
      if (!success) {
        setError('Credenciales inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Error durante el login');
    }
  };

  const handleClearDatabase = async () => {
    setIsResetting(true);
    try {
      await clearDatabaseCompletely();
      setError('');
      alert('Base de datos limpiada completamente. Recarga la página para continuar.');
    } catch (error) {
      console.error('Error clearing database:', error);
      setError('Error al limpiar la base de datos');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetToTestData = async () => {
    setIsResetting(true);
    try {
      await resetDatabaseToEmpty();
      setError('');
      alert('Base de datos vaciada. Ahora inicia sesión para sincronizar con el servidor GraphQL.');
    } catch (error) {
      console.error('Error resetting database:', error);
      setError('Error al reiniciar la base de datos');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-white">
      <div className="mx-auto w-full max-w-sm">
        {/* Musgrave Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-musgrave-500 text-white text-2xl font-bold px-4 py-2 rounded transform -rotate-12">
            M
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Musgrave APP</h1>
        <p className="text-gray-600 text-center mb-8">Acceda a su cuenta</p>
        
        <Form {...form}>
          <form onSubmit={(e) => {
            console.log('Form submit event triggered');
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500 focus:border-musgrave-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-musgrave-500 focus:border-musgrave-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Development Panel */}
            <Collapsible open={isDevPanelOpen} onOpenChange={setIsDevPanelOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 p-0 h-auto"
                >
                  <div className="flex items-center space-x-2">
                    <Settings size={16} />
                    <span>Opciones de Desarrollo</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${isDevPanelOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border">
                {/* Sync Entity Selection */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Entidades a sincronizar:
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sync-taxes"
                        checked={syncEntities.taxes}
                        onCheckedChange={(checked) => 
                          setSyncEntities(prev => ({ ...prev, taxes: !!checked }))
                        }
                      />
                      <label htmlFor="sync-taxes" className="text-xs text-gray-600 cursor-pointer">
                        Impuestos (IVA)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sync-products"
                        checked={syncEntities.products}
                        onCheckedChange={(checked) => 
                          setSyncEntities(prev => ({ ...prev, products: !!checked }))
                        }
                      />
                      <label htmlFor="sync-products" className="text-xs text-gray-600 cursor-pointer">
                        Productos
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sync-delivery-centers"
                        checked={syncEntities.deliveryCenters}
                        onCheckedChange={(checked) => 
                          setSyncEntities(prev => ({ ...prev, deliveryCenters: !!checked }))
                        }
                      />
                      <label htmlFor="sync-delivery-centers" className="text-xs text-gray-600 cursor-pointer">
                        Centros de Entrega
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sync-stores"
                        checked={syncEntities.stores}
                        onCheckedChange={(checked) => 
                          setSyncEntities(prev => ({ ...prev, stores: !!checked }))
                        }
                      />
                      <label htmlFor="sync-stores" className="text-xs text-gray-600 cursor-pointer">
                        Tiendas
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sync-users"
                        checked={syncEntities.users}
                        onCheckedChange={(checked) => 
                          setSyncEntities(prev => ({ ...prev, users: !!checked }))
                        }
                      />
                      <label htmlFor="sync-users" className="text-xs text-gray-600 cursor-pointer">
                        Usuarios
                      </label>
                    </div>
                  </div>
                </div>

                {/* Storage Type Selection */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Tipo de almacenamiento:
                  </FormLabel>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="storage-indexeddb" 
                        name="storage-type" 
                        checked={storageType === 'indexeddb'} 
                        onChange={() => setStorageType('indexeddb')}
                        className="text-musgrave-500 focus:ring-musgrave-500"
                      />
                      <label htmlFor="storage-indexeddb" className="text-xs text-gray-600 cursor-pointer">
                        IndexedDB (Recomendado) - Sin límites, mejor rendimiento
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="storage-sql" 
                        name="storage-type" 
                        checked={storageType === 'sql'} 
                        onChange={() => setStorageType('sql')}
                        className="text-musgrave-500 focus:ring-musgrave-500"
                      />
                      <label htmlFor="storage-sql" className="text-xs text-gray-600 cursor-pointer">
                        SQL.js (Limitado) - Solo para pocos productos
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Development Buttons */}
                <div className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Herramientas de Desarrollo:
                  </FormLabel>
                  <div className="flex flex-col space-y-2">
                    <Button
                      type="button"
                      onClick={handleResetToTestData}
                      disabled={isResetting}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                    >
                      🧪 Test Sync Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={handleClearDatabase}
                      disabled={isResetting}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-red-600 hover:text-red-700"
                    >
                      🗑️ Clear Database
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        try {
                          const syncData = query(`SELECT entity_name, last_request_timestamp, last_updated_timestamp FROM sync_config ORDER BY entity_name`);
                          console.log('=== TABLA SYNC ===');
                          console.table(syncData.map(row => ({
                            entity: row.entity_name,
                            last_request: row.last_request_timestamp ? new Date(row.last_request_timestamp).toLocaleString() : 'Never',
                            last_updated: row.last_updated_timestamp ? new Date(row.last_updated_timestamp).toLocaleString() : 'Never'
                          })));
                          alert(`Tabla sync mostrada en consola. ${syncData.length} registros encontrados.`);
                        } catch (error) {
                          console.error('Error reading sync table:', error);
                          alert('Error leyendo tabla sync - ver consola');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-blue-600 hover:text-blue-700"
                    >
                      📊 Ver Sync Table
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <div className="text-right">
              <a href="#" className="text-musgrave-600 text-sm">¿Olvidaste tu contraseña?</a>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <Button
              type="submit"
              disabled={isLoading}
              onClick={() => console.log('Button clicked!')}
              className="w-full bg-musgrave-500 text-white py-3 rounded-lg font-medium hover:bg-musgrave-600"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </Form>
            
        <p className="text-xs text-gray-500 text-center mt-6">
          Si tienes dificultades para entrar en la aplicación, envíanos<br />
          un email a: info@musgrave.com
        </p>
      </div>
    </div>
  );
}
