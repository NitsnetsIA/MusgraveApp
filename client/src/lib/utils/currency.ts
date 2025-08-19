/**
 * Format currency in Spanish format
 * @param amount - The amount to format
 * @returns Formatted currency string in Spanish format (e.g., "1.234,56 €")
 */
export function formatSpanishCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price per unit in Spanish format
 * @param totalPrice - Total price of the product
 * @param quantityMeasure - Quantity measure (e.g., 0.5 for 0.5kg)
 * @param unitOfMeasure - Unit of measure (e.g., "kg", "L", "unidad")
 * @returns Formatted price per unit string (e.g., "8,26 €/kg")
 */
export function formatPricePerUnit(totalPrice: number, quantityMeasure: number, unitOfMeasure: string): string {
  if (!quantityMeasure || quantityMeasure <= 0) {
    return ''; // Return empty if no valid quantity
  }
  
  // Calculate price per unit (e.g., 4.13 / 0.5 = 8.26 €/kg)
  const pricePerUnit = totalPrice / quantityMeasure;
  
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pricePerUnit);
  
  return `${formattedPrice} €/${unitOfMeasure}`;
}