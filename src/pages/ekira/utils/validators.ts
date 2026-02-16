export const formatIBAN = (value: string): string => {
  let raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (raw.length >= 1 && raw[0] !== 'T') {
    if (/^\d/.test(raw)) raw = 'TR' + raw;
    else raw = 'TR';
  }
  if (raw.length >= 2 && raw.slice(0, 2) !== 'TR') {
    raw = 'TR' + raw.slice(2);
  }
  raw = raw.slice(0, 26);
  if (raw.length > 2) {
    raw = 'TR' + raw.slice(2).replace(/\D/g, '');
  }
  const parts: string[] = [];
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4));
  }
  return parts.join(' ');
};

export const cleanIBAN = (formatted: string): string => formatted.replace(/\s/g, '');

export const isValidIBAN = (value: string): boolean => {
  const clean = cleanIBAN(value);
  return /^TR\d{24}$/.test(clean);
};

export const formatTCKN = (value: string): string => value.replace(/\D/g, '').slice(0, 11);

export const isValidTCKN = (value: string): boolean => /^\d{11}$/.test(value);

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
};

export const cleanPhone = (formatted: string): string => formatted.replace(/\s/g, '');
