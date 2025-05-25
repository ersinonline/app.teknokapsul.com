export type CategoryType = 'ev' | 'araba' | 'sigorta' | 'kredi' | 'giyim' | 'market';

export const DEFAULT_CATEGORIES: Record<CategoryType, string> = {
  ev: 'Ev Giderleri',
  araba: 'Araç Giderleri',
  sigorta: 'Sigorta Ödemeleri',
  kredi: 'Kredi Ödemeleri',
  giyim: 'Giyim Alışverişi',
  market: 'Market Alışverişi'
} as const;

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