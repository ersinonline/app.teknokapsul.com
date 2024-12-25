export type CategoryType = 'market' | 'akaryakit' | 'giyim' | 'yemek' | 'ev';

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
  market: 'Market',
  akaryakit: 'Akaryakıt',
  giyim: 'Giyim/Aksesuar',
  yemek: 'Yeme/İçme',
  ev: 'Ev/Dekorasyon'
};