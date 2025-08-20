import { useMemo, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';

// Hook personalizado que solo se suscribe a la cantidad de un producto específico
export function useCartQuantity(ean: string) {
  const { state } = useCart();
  
  // Usar useMemo para calcular la cantidad solo cuando cambie este producto específico
  const quantity = useMemo(() => {
    const item = state.items.find(item => item.ean === ean);
    return item ? item.quantity : 0;
  }, [ean, state.items]);

  return quantity;
}

// Hook para obtener solo la función de añadir al carrito
export function useAddToCart() {
  const { addToCart } = useCart();
  
  const addProductToCart = useCallback(async (ean: string, quantity: number) => {
    // Importar el servicio de base de datos solo cuando sea necesario
    const { UnifiedDatabaseService } = await import('@/lib/database-service');
    
    try {
      const product = await UnifiedDatabaseService.getProductByEan(ean);
      if (product) {
        const taxRate = await UnifiedDatabaseService.getTaxRate(product.tax_code);
        
        const newItem = {
          ean: product.ean,
          ref: product.ref,
          title: product.title,
          description: product.description,
          base_price: product.base_price,
          tax_rate: taxRate || 0.21,
          quantity,
          unit_of_measure: product.unit_of_measure,
          quantity_measure: product.quantity_measure,
          image_url: product.image_url
        };
        
        addToCart(newItem);
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }, [addToCart]);

  return addProductToCart;
}

// Hook para obtener solo las funciones de actualizar y eliminar
export function useCartItemActions() {
  const { updateCartItem, removeFromCart } = useCart();
  
  const updateQuantity = useCallback((ean: string, quantity: number) => {
    updateCartItem(ean, quantity);
  }, [updateCartItem]);

  const removeItem = useCallback((ean: string) => {
    removeFromCart(ean);
  }, [removeFromCart]);

  return { updateQuantity, removeItem };
}
