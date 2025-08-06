import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { loginSchema, type LoginForm } from '@shared/schema';
import { clearDatabaseCompletely, resetDatabaseToTestData } from '@/lib/database';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function Login({ onLogin, isLoading }: LoginProps) {
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

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
      const success = await onLogin(data.email, data.password);
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
      await resetDatabaseToTestData();
      setError('');
      alert('Base de datos reiniciada con datos de prueba. Recarga la página para continuar.');
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

        {/* Test Database Buttons */}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-gray-400 text-center font-medium">HERRAMIENTAS DE DESARROLLO</p>
          
          <Button
            type="button"
            disabled={isResetting}
            onClick={handleClearDatabase}
            className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            {isResetting ? 'Procesando...' : '🗑️ Limpiar BD Completamente'}
          </Button>
          
          <Button
            type="button"
            disabled={isResetting}
            onClick={handleResetToTestData}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {isResetting ? 'Procesando...' : '🔄 Resetear a Datos de Prueba'}
          </Button>
          
          <Button
            type="button"
            disabled={isResetting}
            onClick={async () => {
              try {
                setIsResetting(true);
                const { query } = await import('../lib/database');
                
                // Clear products and taxes data
                query('DELETE FROM products');
                query('DELETE FROM taxes');
                
                // Reset sync configuration for products and taxes
                query('DELETE FROM sync_config WHERE entity_name IN ("products", "taxes")');
                
                // Save the database changes
                const { saveDatabase } = await import('../lib/database');
                saveDatabase();
                
                console.log('🧪 Test sync reset: Cleared products, taxes and sync config');
                alert('Datos de productos y taxes borrados. Sync config resetado.');
              } catch (error) {
                console.error('Error in test sync reset:', error);
                alert('Error al limpiar datos');
              } finally {
                setIsResetting(false);
              }
            }}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            🧪 Test Sync Reset
          </Button>
        </div>
            
        <p className="text-xs text-gray-500 text-center mt-6">
          Si tienes dificultades para entrar en la aplicación, envíanos<br />
          un email a: info@musgrave.com
        </p>
      </div>
    </div>
  );
}
