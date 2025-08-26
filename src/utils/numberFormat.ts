/**
 * Sayıları binlik ayırıcı ile formatlar (1000 -> 1.000)
 */
export const formatNumberWithThousandsSeparator = (value: string | number): string => {
  if (!value && value !== 0) return '';
  
  const numStr = value.toString();
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Binlik ayırıcı ekle
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
};

/**
 * Formatlanmış sayıyı normal sayıya çevirir (1.000,50 -> 1000.50)
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  
  // Binlik ayırıcıları kaldır ve virgülü noktaya çevir
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Input alanı için onChange handler
 */
export const handleNumberInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  callback: (value: number) => void
) => {
  const inputValue = e.target.value;
  const numericValue = parseFormattedNumber(inputValue);
  
  // Formatlanmış değeri input'a geri yaz
  e.target.value = formatNumberWithThousandsSeparator(numericValue);
  
  callback(numericValue);
};

/**
 * Para birimi formatı (₺ ile)
 */
export const formatCurrency = (value: number): string => {
  return `₺${formatNumberWithThousandsSeparator(value)}`;
};