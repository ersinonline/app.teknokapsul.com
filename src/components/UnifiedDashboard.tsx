import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Banknote, 
  PiggyBank, 
  AlertCircle, 
  CheckCircle, 
  Brain, 
  Package, 
  Truck, 
  ExternalLink, 
  DollarSign, 
  Wrench,
  Shield,
  FileText,
  StickyNote,
  HelpCircle,
  Bot,
  Crown,
  PieChart,
  BarChart3,
  Wallet,
  Home,
  Grid3X3,
  Gift,
  Zap,
  Bell,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles
} from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { Alerts } from './dashboard/Alerts';
import { Payment } from '../types/data';
import { Subscription } from '../types/subscription';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { CreditCard as CreditCardType, CashAdvanceAccount, Loan } from '../types/financial';
import { PortfolioItem, PortfolioSummary } from '../types/portfolio';
import { calculateDaysRemaining } from '../utils/date';
import { formatCurrency } from '../utils/currency';

import { getUserExpenses } from '../services/expense.service';
import { getUserIncomes } from '../services/income.service';
import { getUserSubscriptions } from '../services/subscription.service';
import { getCreditCards, getCashAdvanceAccounts, getLoans } from '../services/financial.service';
import { getAIRecommendations } from '../services/ai.service';
import { getUserCargoTrackings } from '../services/cargo.service';
import { CargoTracking, CARGO_COMPANIES } from '../types/cargo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../services/portfolio.service';
import { 
  StatCardSkeleton, 
  CreditCardSkeleton, 
  CargoSkeleton 
} from './common/SkeletonLoader';

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  bgColor: string;
  textColor: string;
  category: 'finance' | 'services' | 'tools';
}

export const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('overview');
  
  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [cashAdvanceAccounts, setCashAdvanceAccounts] = useState<CashAdvanceAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [cargoList, setCargoList] = useState<CargoTracking[]>([]);
  
  // Loading states
  const [cargoLoading, setCargoLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel
        const [
          expensesData,
          incomesData,
          subscriptionsData,
          creditCardsData,
          cashAdvanceData,
          loansData,
          portfolioItems
        ] = await Promise.all([
          getUserExpenses(user.id, currentYear, currentMonth),
          getUserIncomes(user.id, currentYear, currentMonth),
          getUserSubscriptions(user.id),
          getCreditCards(user.id),
          getCashAdvanceAccounts(user.id),
          getLoans(user.id),
          portfolioService.getPortfolioItems(user.id)
        ]);

        setExpenses(expensesData);
        setIncomes(incomesData);
        setSubscriptions(subscriptionsData);
        setCreditCards(creditCardsData);
        setCashAdvanceAccounts(cashAdvanceData);
        setLoans(loansData);
        setPortfolioData(portfolioItems);

        // Calculate portfolio summary
        if (portfolioItems.length > 0) {
          const summary = portfolioService.calculatePortfolioSummary(portfolioItems);
          setPortfolioSummary(summary);
        }

        // Load cargo tracking
        setCargoLoading(true);
        try {
          const cargoData = await getUserCargoTrackings(user.id);
          setCargoList(cargoData);
        } catch (cargoError) {
          console.error('Cargo loading error:', cargoError);
        } finally {
          setCargoLoading(false);
        }

        // Load AI recommendations
        setAiLoading(true);
        try {
          const recommendations = await getAIRecommendations(user.id);
          setAiRecommendations(recommendations);
        } catch (aiError) {
          console.error('AI recommendations error:', aiError);
        } finally {
          setAiLoading(false);
        }

      } catch (err) {
        console.error('Dashboard data loading error:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentYear, currentMonth]);

  // Calculate enhanced financial stats
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const totalBalance = netBalance;
  const monthlyIncome = totalIncome;
  const monthlyExpenses = totalExpense;

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalCreditUsed = creditCards.reduce((sum, card) => sum + card.currentDebt, 0);
  const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  // Calculate savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Calculate total debt from all sources
  const totalDebt = creditCards.reduce((sum, card) => sum + card.currentDebt, 0) +
                   cashAdvanceAccounts.reduce((sum, account) => sum + account.currentDebt, 0) +
                   loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

  // Enhanced Income Sources
  const topIncomeSources = incomes
    .reduce((acc: { source: string; amount: number }[], income: Income) => {
      const existingSource = acc.find(item => item.source === income.category);
      if (existingSource) {
        existingSource.amount += income.amount;
      } else {
        acc.push({ source: income.category, amount: income.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Enhanced Subscription Analysis
  const subscriptionAnalysis = subscriptions
    .filter(sub => sub.isActive)
    .reduce((acc: { name: string; amount: number }[], sub: Subscription) => {
      acc.push({ name: sub.name, amount: sub.price });
      return acc;
    }, [])
    .sort((a, b) => b.amount - a.amount);

  // Create recent transactions from expenses and incomes
  const recentTransactions = [
    ...expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      type: 'expense' as const,
      category: expense.category
    })),
    ...incomes.map(income => ({
      id: income.id,
      description: income.description,
      amount: income.amount,
      date: income.date,
      type: 'income' as const,
      category: income.category
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  // Enhanced quick actions
  const quickActions = [
    { id: 'add-income', title: 'Gelir Ekle', path: '/income', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
    { id: 'add-expense', title: 'Gider Ekle', path: '/expenses', bgColor: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400', icon: TrendingDown },
    { id: 'portfolio', title: 'Portföy', path: '/portfolio', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', icon: PieChart },
    { id: 'goals', title: 'Hedefler', path: '/goals', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', icon: Target },
    { id: 'subscriptions', title: 'Abonelikler', path: '/subscriptions', bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400', icon: CreditCard },
    { id: 'cargo', title: 'Kargo Takip', path: '/cargo-tracking', bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', icon: Package }
  ];

  // Enhanced stats cards
  const statsCards = [
    {
      title: 'Net Bakiye',
      value: `₺${totalBalance.toLocaleString('tr-TR')}`,
      change: savingsRate > 0 ? `+%${savingsRate.toFixed(1)}` : `%${savingsRate.toFixed(1)}`,
      changeType: savingsRate >= 0 ? 'positive' : 'negative',
      icon: Wallet,
      color: 'blue'
    },
    {
      title: 'Bu Ay Gelir',
      value: `₺${monthlyIncome.toLocaleString('tr-TR')}`,
      change: `${incomes.length} işlem`,
      changeType: 'neutral',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Bu Ay Gider',
      value: `₺${monthlyExpenses.toLocaleString('tr-TR')}`,
      change: `${expenses.length} işlem`,
      changeType: 'neutral',
      icon: TrendingDown,
      color: 'rose'
    },
    {
      title: 'Toplam Borç',
      value: `₺${totalDebt.toLocaleString('tr-TR')}`,
      change: `%${creditUtilization.toFixed(1)} kullanım`,
      changeType: creditUtilization > 70 ? 'negative' : creditUtilization > 30 ? 'warning' : 'positive',
      icon: CreditCard,
      color: 'amber'
    },
    {
      title: 'Portföy Değeri',
      value: `₺${portfolioSummary?.totalValue?.toLocaleString('tr-TR') || '0'}`,
      change: portfolioSummary ? `%${portfolioSummary.totalReturn?.toFixed(1) || '0'}` : '0%',
      changeType: (portfolioSummary?.totalReturn || 0) >= 0 ? 'positive' : 'negative',
      icon: PieChart,
      color: 'indigo'
    },
    {
      title: 'Aktif Abonelik',
      value: subscriptions.length.toString(),
      change: `₺${subscriptions.reduce((sum, sub) => sum + sub.price, 0).toLocaleString('tr-TR')}/ay`,
      changeType: 'neutral',
      icon: Crown,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-emerald-600 dark:text-emerald-400';
      case 'negative': return 'text-rose-600 dark:text-rose-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading && expenses.length === 0 && incomes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Takes 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Hızlı İşlemler
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 group"
                  >
                    <div className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform duration-200 mb-3`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {action.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Takes 1/3 on desktop */}
          <div className="space-y-8">
            {/* Credit Cards Summary */}
            {creditCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Kredi Kartları
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {creditCards.slice(0, 3).map((card) => (
                      <div key={card.id} className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {card.bank}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ****{card.cardNumber.slice(-4)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ₺{card.currentDebt.toLocaleString('tr-TR')} / ₺{card.limit.toLocaleString('tr-TR')}
                          </p>
                          <p className={`text-sm font-medium ${card.debtRatio > 70 ? 'text-rose-600 dark:text-rose-400' : card.debtRatio > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            %{card.debtRatio.toFixed(1)}
                          </p>
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${card.debtRatio > 70 ? 'bg-rose-500' : card.debtRatio > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(card.debtRatio, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cargo Tracking */}
            {cargoList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Kargo Takip
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {cargoList.slice(0, 3).map((cargo) => (
                      <div key={cargo.id} className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {cargo.name}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cargo.isDelivered ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                            {cargo.isDelivered ? 'Teslim Edildi' : 'Takip Ediliyor'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {CARGO_COMPANIES[cargo.company]?.name || cargo.company}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {cargo.trackingNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Önerileri
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {aiRecommendations.slice(0, 3).map((recommendation, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};