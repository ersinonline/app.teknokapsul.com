export type CategoryType = 'ev' | 'araba' | 'sigorta' | 'kredi' | 'giyim' | 'market';

export interface Budget {
  id: string;
  userId: string;
  totalBudget: number;
  categories: {
    [key in CategoryType]: {
      limit: number;
      spent: number;
      paidAmount?: number;
      unpaidAmount?: number;
    };
  };
  monthlyIncome: number;
}