import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Simple test component
function SimpleApp() {
  const [message, setMessage] = useState("Cargando...");

  useEffect(() => {
    setMessage("¡Aplicación funcionando correctamente!");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="inline-block bg-green-500 text-white text-2xl font-bold px-4 py-2 rounded mb-4">
          M
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Musgrave</h1>
        <p className="text-gray-600 text-lg">{message}</p>
        <button 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setMessage("¡Botón funcionando!")}
        >
          Probar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleApp />
      <Toaster />
    </QueryClientProvider>
  );
}