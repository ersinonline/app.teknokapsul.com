/**
 * Formats a number or string amount to currency format with TL
 * Safely handles undefined, null, and invalid values
 */
export const formatCurrency = (amount: string | number | undefined | null): string => {
  // Handle undefined, null or empty values
  if (amount === undefined || amount === null || amount === '') {
    return '₺0,00';
  }

  // If amount already includes TL or ₺, return formatted version
  if (typeof amount === 'string' && (amount.includes('TL') || amount.includes('₺'))) {
    const numericAmount = parseCurrency(amount);
    return `₺${numericAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  try {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(',', '.'))
      : amount;

    // Check if conversion resulted in a valid number
    if (isNaN(numericAmount)) {
      return '₺0,00';
    }

    return `₺${numericAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '₺0,00';
  }
};

/**
 * Parses a currency string to a number
 * Safely handles invalid values and different types
 */
export const parseCurrency = (amount: string | number | undefined | null): number => {
  if (!amount) return 0;
  
  try {
    // If amount is already a number, return it
    if (typeof amount === 'number') {
      return amount;
    }
    
    // Convert to string and clean up
    const amountStr = String(amount);
    const cleanAmount = amountStr
      .replace(/[₺\sTL]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Error parsing currency:', error);
    return 0;
  }
};

/**
 * Sayıyı yüzde formatında gösterir
 * @param percentage - Yüzde değeri
 * @param decimals - Ondalık basamak sayısı (varsayılan: 2)
 * @returns Formatlanmış yüzde string'i
 */
export const formatPercentage = (percentage: number, decimals: number = 2): string => {
  return `%${percentage.toFixed(decimals)}`;
};

/**
 * Büyük sayıları kısaltılmış formatta gösterir (1.2M, 850K gibi)
 * @param amount - Formatlanacak miktar
 * @param showSymbol - Para birimi sembolünü göster (varsayılan: true)
 * @returns Kısaltılmış format string'i
 */
export const formatCompactCurrency = (amount: number, showSymbol: boolean = true): string => {
  const absAmount = Math.abs(amount);
  let formatted: string;
  
  if (absAmount >= 1000000000) {
    formatted = (amount / 1000000000).toFixed(1) + 'B';
  } else if (absAmount >= 1000000) {
    formatted = (amount / 1000000).toFixed(1) + 'M';
  } else if (absAmount >= 1000) {
    formatted = (amount / 1000).toFixed(1) + 'K';
  } else {
    formatted = amount.toFixed(2);
  }
  
  return showSymbol ? `₺${formatted}` : formatted;
};

/**
 * Getiri değerini renkli formatta gösterir
 * @param amount - Getiri miktarı
 * @param percentage - Getiri yüzdesi
 * @returns Formatlanmış getiri objesi
 */
export const formatReturn = (amount: number, percentage: number) => {
  const isPositive = amount >= 0;
  const sign = isPositive ? '+' : '';
  
  return {
    amount: `${sign}${formatCurrency(amount)}`,
    percentage: `${sign}${formatPercentage(percentage)}`,
    isPositive,
    colorClass: isPositive ? 'text-green-600' : 'text-red-600',
    bgColorClass: isPositive ? 'bg-green-100' : 'bg-red-100'
  };
};

/**
 * Sayıyı binlik ayırıcılarla formatlar
 * @param number - Formatlanacak sayı
 * @param decimals - Ondalık basamak sayısı (varsayılan: 0)
 * @returns Formatlanmış sayı string'i
 */
export const formatNumber = (number: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * İki para birimi değerini karşılaştırır
 * @param current - Güncel değer
 * @param previous - Önceki değer
 * @returns Karşılaştırma sonucu
 */
export const compareCurrency = (current: number, previous: number) => {
  const difference = current - previous;
  const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0;
  
  return {
    difference,
    percentageChange,
    isIncrease: difference > 0,
    isDecrease: difference < 0,
    isEqual: difference === 0,
    formattedDifference: formatReturn(difference, percentageChange)
  };
};

/**
 * Değeri gizleme/gösterme için formatlar
 * @param amount - Miktar
 * @param isVisible - Görünür mü?
 * @param formatter - Kullanılacak formatlayıcı fonksiyon
 * @returns Formatlanmış veya gizlenmiş değer
 */
export const formatWithVisibility = (
  amount: number, 
  isVisible: boolean, 
  formatter: (amount: number) => string = (amt) => formatCurrency(amt)
): string => {
  return isVisible ? formatter(amount) : '••••••';
};