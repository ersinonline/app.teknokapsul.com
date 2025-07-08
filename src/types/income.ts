export interface Income {
  id: string;
  title: string;
  amount: number;
  date: string;
  userId: string;
  category: 'salary' | 'freelance' | 'investment' | 'bonus' | 'other';
  description?: string;
  isRecurring: boolean;
  recurringDay?: number; // Aylık tekrarlanan gelirler için hangi gün
  startDate?: string; // Düzenli gelir başlangıç tarihi
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeFormData {
  title: string;
  amount: number;
  date?: string;
  category: 'salary' | 'freelance' | 'investment' | 'bonus' | 'other';
  description?: string;
  isRecurring: boolean;
  recurringDay?: number;
  startDate?: string; // Düzenli gelir başlangıç tarihi
  isActive?: boolean;
}

export const INCOME_CATEGORIES = {
  salary: 'Maaş',
  freelance: 'Serbest Çalışma',
  investment: 'Yatırım',
  bonus: 'Bonus/İkramiye',
  other: 'Diğer'
} as const;