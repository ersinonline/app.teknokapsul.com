export type CategoryType = 'ev' | 'araba' | 'sigorta' | 'kredi' | 'giyim' | 'market';

export interface Budget {
  id: string;
  userId: string;
  totalBudget: number;
  categories: {
    [key in CategoryType]: {
      limit: number;
      spent: number;
    };
  };
}

export const DEFAULT_CATEGORIES: Record<CategoryType, string> = {
  ev: 'Ev Giderleri',
  araba: 'Araba Giderleri',
  sigorta: 'Sigorta Ödemeleri',
  kredi: 'Kredi Ödemeleri',
  giyim: 'Giyim Alışverişi',
  market: 'Market Alışverişi'
};