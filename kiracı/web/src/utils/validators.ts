/**
 * IBAN formatter: TR + 24 rakam = 26 karakter toplam
 * Görüntü formatı: TR11 1111 1111 1111 1111 1111 11
 * (İlk grup 4, sonraki gruplar 4'er, son grup 2)
 */
export const formatIBAN = (value: string): string => {
  // Sadece harf ve rakamları al
  let raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // TR ile başlamasını zorla
  if (raw.length >= 1 && raw[0] !== 'T') {
    if (/^\d/.test(raw)) raw = 'TR' + raw;
    else raw = 'TR';
  }
  if (raw.length >= 2 && raw.slice(0, 2) !== 'TR') {
    raw = 'TR' + raw.slice(2);
  }

  // Maks 26 karakter (TR + 24 rakam)
  raw = raw.slice(0, 26);

  // TR'den sonra sadece rakam
  if (raw.length > 2) {
    raw = 'TR' + raw.slice(2).replace(/\D/g, '');
  }

  // 4'lü gruplar halinde formatla
  const parts: string[] = [];
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4));
  }
  return parts.join(' ');
};

/** IBAN'dan sadece rakam ve harfleri çıkar (kayıt için) */
export const cleanIBAN = (formatted: string): string => {
  return formatted.replace(/\s/g, '');
};

/** IBAN geçerli mi? TR + 24 rakam = 26 karakter */
export const isValidIBAN = (value: string): boolean => {
  const clean = cleanIBAN(value);
  return /^TR\d{24}$/.test(clean);
};

/**
 * TCKN formatter: sadece rakam, maks 11 hane
 */
export const formatTCKN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 11);
};

/** TCKN geçerli mi? 11 haneli rakam */
export const isValidTCKN = (value: string): boolean => {
  return /^\d{11}$/.test(value);
};

/** E-posta geçerli mi? @ simgesi içermeli */
export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/** Telefon formatter: sadece rakam, maks 11 */
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
};

/** Telefon temizle */
export const cleanPhone = (formatted: string): string => {
  return formatted.replace(/\s/g, '');
};
