export interface PortfolioItem {
  id: string;
  userId: string;
  type: 'stock' | 'fund' | 'gold' | 'usd' | 'eur' | 'crypto' | 'deposit';
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

export interface MarketData {
  code: string;
  type: string;
  country: string | null;
  countryISO: string | null;
  symbol: string | null;
  flag_1x1: string;
  flag_4x3: string;
  name: string;
  name_TR: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalInvestment: number;
  totalReturn: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  returnPercentage: number;
  dayChange: number;
  dayChangePercent: number;
  bestPerformer: PortfolioItem | null;
  worstPerformer: PortfolioItem | null;
  lastUpdated: Date;
  totalItems: number;
  itemCount: number;
  categoryBreakdown: Array<{
    category: string;
    value: number;
    count: number;
  }>;
}

export interface AIRecommendation {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'diversify' | 'warning';
  title: string;
  description: string;
  symbol?: string;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  targetPrice?: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  expectedReturn?: number;
  createdAt: Date;
}

export interface PortfolioAnalysis {
  diversificationScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: AIRecommendation[];
  sectorAllocation: { [key: string]: number };
  assetAllocation: { [key: string]: number };
  performanceMetrics: {
    sharpeRatio: number;
    volatility: number;
    maxDrawdown: number;
  };
  stabilityScore: number;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

export const PORTFOLIO_CATEGORIES = {
  stock: 'Hisse Senedi',
  fund: 'Fon',
  gold: 'Altın',
  usd: 'ABD Doları',
  eur: 'Euro',
  crypto: 'Kripto Para',
  deposit: 'Vadeli Hesap'
} as const;

export const GOLD_TYPES = {
  'XAU': 'Gram Altın',
  'GOLD_OUNCE': 'Altın (ONS)',
  'TAMALTIN': 'Tam Altın',
  'YARIMALTIN': 'Yarım Altın',
  'CEYREKALTIN': 'Çeyrek Altın',
  'CUMHURIYETALTINI': 'Cumhuriyet Altını',
  'RESATALTIN': 'Reşat Altını',
  '22BILEZIK': '22 Ayar Bilezik',
  '18AYARALTIN': '18 Ayar Altın',
  '14AYARALTIN': '14 Ayar Altın'
} as const;

export const CURRENCY_TYPES = {
  'USD': 'ABD Doları',
  'EUR': 'Euro'
} as const;