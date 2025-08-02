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
 * @param price - Price per unit
 * @param unit - Unit (e.g., "kg", "L", "unidad")
 * @returns Formatted price per unit string
 */
export function formatPricePerUnit(price: number, unit: string): string {
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  
  return `${formattedPrice} €/${unit}`;
}