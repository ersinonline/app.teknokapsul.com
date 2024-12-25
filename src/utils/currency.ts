/**
 * Formats a number or string amount to currency format with TL
 * Safely handles undefined, null, and invalid values
 */
 export const formatCurrency = (amount: string | number | undefined | null): string => {
  // Handle undefined, null or empty values
  if (amount === undefined || amount === null || amount === '') {
    return '0.00 TL';
  }

  // If amount already includes TL, return as is
  if (typeof amount === 'string' && amount.includes('TL')) {
    return amount;
  }

  try {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(',', '.'))
      : amount;

    // Check if conversion resulted in a valid number
    if (isNaN(numericAmount)) {
      return '0.00 TL';
    }

    return `${numericAmount.toFixed(2)} TL`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0.00 TL';
  }
};

/**
 * Parses a currency string to a number
 * Safely handles invalid values
 */
export const parseCurrency = (amount: string | undefined | null): number => {
  if (!amount) return 0;
  
  try {
    const cleanAmount = amount
      .replace(' TL', '')
      .replace(',', '.');
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Error parsing currency:', error);
    return 0;
  }
};