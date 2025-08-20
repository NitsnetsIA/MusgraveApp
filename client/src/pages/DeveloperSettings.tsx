import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Server, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function DeveloperSettings() {
  const [, setLocation] = useLocation();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('development');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('graphql_endpoint_preference');
    setSelectedEndpoint(saved || 'development');
  }, []);

  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
    localStorage.setItem('graphql_endpoint_preference', value);
    
    // Show confirmation
    const message = value === 'production' 
      ? 'Ahora usarás el servidor GraphQL de PRODUCCIÓN'
      : 'Ahora usarás el servidor GraphQL de DESARROLLO';
    
    alert(message);
  };

  const endpoints = {
    development: {
      label: 'Desarrollo',
      url: 'https://dcf77d88-2e9d-4810-ad7c-bda46c3afaed-00-19tc7g93ztbc4.riker.replit.dev:3000/',
      description: 'Servidor de desarrollo para pruebas'
    },
    production: {
      label: 'Producción',
      url: 'https://pim-grocery-ia64.replit.app/graphql',
      description: 'Servidor de producción real'
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
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Desarrollo
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Servidor GraphQL
          </CardTitle>
          <CardDescription>
            Selecciona qué servidor GraphQL usar para sincronización y envío de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={selectedEndpoint} 
            onValueChange={handleEndpointChange}
            className="space-y-4"
          >
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <div key={key} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={key} id={key} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={key} className="text-base font-medium cursor-pointer">
                    {endpoint.label}
                  </Label>
                  <div className="text-sm text-gray-500 mt-1">
                    {endpoint.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono break-all">
                    {endpoint.url}
                  </div>
                  {selectedEndpoint === key && (
                    <div className="text-xs text-green-600 mt-2 font-medium">
                      ✓ Actualmente en uso
                    </div>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>Nota:</strong> Este cambio afecta todas las operaciones de sincronización 
              y envío de órdenes de compra. En producción, siempre se usa automáticamente 
              el servidor de producción.
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Guardar y Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}