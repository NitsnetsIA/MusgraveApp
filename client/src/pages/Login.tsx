import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { loginSchema, type LoginForm } from '@shared/schema';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function Login({ onLogin, isLoading }: LoginProps) {
  const [error, setError] = useState('');

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
            
            <p className="text-xs text-gray-500 text-center">
              Si tienes dificultades para entrar en la B2B, envíanos<br />
              un email a: ventasb2b@HOFF.es
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
