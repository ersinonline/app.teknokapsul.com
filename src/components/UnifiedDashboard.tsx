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

  // Calculate enhanced financial stats with null checks
  const totalIncome = incomes.reduce((sum, income) => sum + (income?.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const totalBalance = netBalance;
  const monthlyIncome = totalIncome;
  const monthlyExpenses = totalExpense;

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card?.limit || 0), 0);
  const totalCreditUsed = creditCards.reduce((sum, card) => sum + (card?.currentDebt || 0), 0);
  const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  // Calculate savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Calculate total debt from all sources with null checks
  const totalDebt = creditCards.reduce((sum, card) => sum + (card?.currentDebt || 0), 0) +
                   cashAdvanceAccounts.reduce((sum, account) => sum + (account?.currentDebt || 0), 0) +
                   loans.reduce((sum, loan) => sum + (loan?.remainingAmount || 0), 0);

  // Enhanced Income Sources with null checks
  const topIncomeSources = incomes
    .reduce((acc: { source: string; amount: number }[], income: Income) => {
      const existingSource = acc.find(item => item.source === income?.category);
      if (existingSource) {
        existingSource.amount += (income?.amount || 0);
      } else {
        acc.push({ source: income?.category || 'Unknown', amount: income?.amount || 0 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Enhanced Subscription Analysis with null checks
  const subscriptionAnalysis = subscriptions
    .filter(sub => sub?.isActive)
    .reduce((acc: { name: string; amount: number }[], sub: Subscription) => {
      acc.push({ name: sub?.name || 'Unknown', amount: sub?.price || 0 });
      return acc;
    }, [])
    .sort((a, b) => b.amount - a.amount);

  // Create recent transactions from expenses and incomes with null checks
  const recentTransactions = [
    ...expenses.map(expense => ({
      id: expense?.id || '',
      description: expense?.description || 'Unknown expense',
      amount: expense?.amount || 0,
      date: expense?.date || new Date(),
      type: 'expense' as const,
      category: expense?.category || 'Unknown'
    })),
    ...incomes.map(income => ({
      id: income?.id || '',
      description: income?.description || 'Unknown income',
      amount: income?.amount || 0,
      date: income?.date || new Date(),
      type: 'income' as const,
      category: income?.category || 'Unknown'
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
      change: `₺${subscriptions.reduce((sum, sub) => sum + (sub?.price || 0), 0).toLocaleString('tr-TR')}/ay`,
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
      {/* Compact Header with Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hoş Geldiniz! 👋</h1>
              <p className="text-blue-100 mt-1">Finansal durumunuzun özeti</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Bugün</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Stats Grid - 4 columns instead of 6 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.slice(0, 4).map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className={`text-xs font-medium ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Grid - 3 columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Quick Actions & Recent Transactions */}
          <div className="space-y-6">
            {/* Compact Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Hızlı İşlemler
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.slice(0, 4).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className={`p-2 rounded-lg ${action.bgColor} mr-3`}>
                      <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Son İşlemler
                </h3>
                <button 
                  onClick={() => navigate('/expenses')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tümünü Gör
                </button>
              </div>
              <div className="space-y-2">
                {recentTransactions.slice(0, 4).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${transaction.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                        {transaction.type === 'income' ? 
                          <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> :
                          <ArrowDownLeft className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {transaction.description.length > 15 ? transaction.description.substring(0, 15) + '...' : transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    <p className={`text-xs font-semibold ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Credit Cards & Portfolio */}
          <div className="space-y-6">
            {/* Credit Cards Summary */}
            {creditCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Kredi Kartları
                  </h3>
                  <button 
                    onClick={() => navigate('/financial')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Detay
                  </button>
                </div>
                <div className="space-y-3">
                  {creditCards.slice(0, 3).map((card) => (
                    <div key={card.id} className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {card.bank}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ****{card.cardNumber.slice(-4)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          ₺{(card.currentDebt || 0).toLocaleString('tr-TR')} / ₺{(card.limit || 0).toLocaleString('tr-TR')}
                        </p>
                        {(() => {
                          const debtRatio = card.debtRatio ?? (card.limit > 0 ? (card.currentDebt / card.limit) * 100 : 0);
                          return (
                            <p className={`text-xs font-medium ${debtRatio > 70 ? 'text-rose-600 dark:text-rose-400' : debtRatio > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              %{debtRatio.toFixed(1)}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        {(() => {
                          const debtRatio = card.debtRatio ?? (card.limit > 0 ? (card.currentDebt / card.limit) * 100 : 0);
                          return (
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${debtRatio > 70 ? 'bg-rose-500' : debtRatio > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(debtRatio, 100)}%` }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Summary */}
            {portfolioSummary && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Portföy Özeti
                  </h3>
                  <button 
                    onClick={() => navigate('/portfolio')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Detay
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Toplam Değer</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₺{portfolioSummary.totalValue?.toLocaleString('tr-TR') || '0'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Getiri</p>
                        <p className={`text-sm font-semibold ${(portfolioSummary.totalReturn || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {(portfolioSummary.totalReturn || 0) >= 0 ? '+' : ''}%{portfolioSummary.totalReturn?.toFixed(1) || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Recommendations & Cargo */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      AI Önerileri
                    </h3>
                  </div>
                  <button 
                    onClick={() => navigate('/ai')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sohbet
                  </button>
                </div>
                <div className="space-y-2">
                  {aiRecommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-start space-x-2">
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-0.5">
                          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-900 dark:text-white leading-relaxed">
                          {recommendation.length > 80 ? recommendation.substring(0, 80) + '...' : recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cargo Tracking */}
            {cargoList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Kargo Takip
                  </h3>
                  <button 
                    onClick={() => navigate('/cargo-tracking')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tümü
                  </button>
                </div>
                <div className="space-y-2">
                  {cargoList.slice(0, 3).map((cargo) => (
                    <div key={cargo.id} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {cargo.name.length > 20 ? cargo.name.substring(0, 20) + '...' : cargo.name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cargo.isDelivered ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                          {cargo.isDelivered ? 'Teslim' : 'Yolda'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {CARGO_COMPANIES[cargo.company]?.name || cargo.company}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Bu Ay Özet
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Gelir</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    ₺{totalIncome.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Gider</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    ₺{totalExpense.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">Net</span>
                  </div>
                  <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ₺{netBalance.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};