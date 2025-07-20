export interface PortfolioItem {
  id: string;
  userId: string;
  type: 'stock' | 'fund' | 'gold' | 'currency' | 'crypto' | 'deposit';
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  averagePrice?: number;
  category?: string;
  metadata?: {
    dailyReturnRate?: number;
    maturityDate?: Date;
    bankName?: string;
    annualInterestRate?: number;
    taxExemptPercentage?: number;
    [key: string]: any;
  };
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
  currency: 'Döviz',
  crypto: 'Kripto Para',
  deposit: 'Vadeli Hesap'
} as const;

export const GOLD_TYPES = {
  'GRAM': 'Gram Altın',
  'ONS': 'Ons Altın',
  'TAM': 'Tam Altın',
  'YARIM': 'Yarım Altın',
  'CEYREK': 'Çeyrek Altın',
  'CUMHURIYET': 'Cumhuriyet Altını',
  'RESAT': 'Reşat Altını',
  'BILEZIK22': '22 Ayar Bilezik',
  'ALTIN18': '18 Ayar Altın',
  'ALTIN14': '14 Ayar Altın'
} as const;

export const CURRENCY_TYPES = {
  'USD': 'ABD Doları',
  'EUR': 'Euro'
} as const;