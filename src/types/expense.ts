export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  userId: string;
  category: 'food' | 'transport' | 'entertainment' | 'shopping' | 'bills' | 'health' | 'education' | 'credit' | 'insurance' | 'fuel' | 'home' | 'other';
  description?: string;
  isInstallment: boolean;
  installmentNumber?: number; // Kaçıncı taksit
  totalInstallments?: number; // Toplam taksit sayısı
  installmentDay?: number; // Aylık taksitler için hangi gün
  installmentEndDate?: string; // Taksitlerin bitiş tarihi
  isActive: boolean;
  isPaid: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: number;
  date?: string;
  category: 'food' | 'transport' | 'entertainment' | 'shopping' | 'bills' | 'health' | 'education' | 'credit' | 'insurance' | 'fuel' | 'home' | 'other';
  description?: string;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentDay?: number;
  installmentEndDate?: string;
  isActive?: boolean;
  isPaid?: boolean;
}

export const EXPENSE_CATEGORIES = {
  food: 'Yemek & İçecek',
  transport: 'Ulaşım',
  entertainment: 'Eğlence',
  shopping: 'Alışveriş',
  bills: 'Faturalar',
  health: 'Sağlık',
  education: 'Eğitim',
  credit: 'Kredi',
  insurance: 'Sigorta',
  fuel: 'Benzin',
  home: 'Ev',
  other: 'Diğer'
} as const;