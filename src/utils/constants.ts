export const DEFAULT_CATEGORIES = {
  ev: 'Ev Giderleri',
  araba: 'Araç Giderleri',
  sigorta: 'Sigorta Ödemeleri',
  kredi: 'Kredi Ödemeleri',
  giyim: 'Giyim Alışverişi',
  market: 'Market Alışverişi'
} as const;

export type CategoryType = keyof typeof DEFAULT_CATEGORIES;