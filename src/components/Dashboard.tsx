import { useState, useEffect } from 'react';
import { CreditCard, Clock, TrendingUp, Target, Calendar, Banknote, PiggyBank, AlertCircle, CheckCircle, Brain, Package, Truck, ExternalLink, DollarSign, Apple as Apps, Wrench } from 'lucide-react';
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
import { useAutoMigration } from '../services/user-migration.service';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checkAndMigrate } = useAutoMigration();
  const { data: payments = [], loading: paymentsLoading } = useFirebaseData<Payment>('payments');

  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [cashAdvanceAccounts, setCashAdvanceAccounts] = useState<CashAdvanceAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cargoList, setCargoList] = useState<CargoTracking[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [incomesLoading, setIncomesLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [cargoLoading, setCargoLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);

  const [aiLoading, setAiLoading] = useState(true);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  


  const loading = paymentsLoading || subscriptionsLoading || expensesLoading || incomesLoading || cargoLoading;
  
  // Gider, gelir ve abonelik verilerini yükle
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setExpensesLoading(true);
        setIncomesLoading(true);
        setSubscriptionsLoading(true);
        setCargoLoading(true);
        
        const [userExpenses, userIncomes, userSubscriptions, userCreditCards, userCashAdvanceAccounts, userLoans, userCargos] = await Promise.all([
          getUserExpenses(user.id, currentYear, currentMonth),
          getUserIncomes(user.id, currentYear, currentMonth),
          getUserSubscriptions(user.id),
          getCreditCards(user.id),
          getCashAdvanceAccounts(user.id),
          getLoans(user.id),
          getUserCargoTrackings(user.id)
        ]);
        
        setExpenses(userExpenses);
        setIncomes(userIncomes);
        setSubscriptions(userSubscriptions);
        setCreditCards(userCreditCards);
        setCashAdvanceAccounts(userCashAdvanceAccounts);
        setLoans(userLoans);
        setCargoList(userCargos);
        
        // AI önerilerini yükle
        try {
          const recommendations = await getAIRecommendations({
            expenses: userExpenses,
            incomes: userIncomes,
            creditCards: userCreditCards,
            cashAdvanceAccounts: userCashAdvanceAccounts,
            loans: userLoans,
            subscriptions: userSubscriptions
          });
          setAiRecommendations(recommendations);
        } catch (aiError) {
          console.error('Error loading AI recommendations:', aiError);
          setAiRecommendations([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setExpensesLoading(false);
        setIncomesLoading(false);
        setSubscriptionsLoading(false);
        setCargoLoading(false);

        setAiLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, currentYear, currentMonth]);

  useEffect(() => {
    const loadPortfolioData = async () => {
      if (!user?.id) return;
      
      try {
        const items = await portfolioService.getPortfolioItems(user.id);
        console.log('🔍 Ham portföy verileri:', items);
        setPortfolioItems(items);
        
        // Aynı sembole sahip yatırımları birleştir
        const consolidatedItems = portfolioService.consolidatePortfolioBySymbol(items);
        console.log('🔍 Birleştirilmiş portföy verileri:', consolidatedItems);
        
        const summary = portfolioService.calculatePortfolioSummary(consolidatedItems);
        console.log('🔍 Hesaplanan portföy özeti:', summary);
        console.log('🔍 Toplam değer:', summary.totalValue);
        
        setPortfolioSummary(summary);
      } catch (error) {
        console.error('Portföy verileri yüklenirken hata:', error);
      }
    };

    loadPortfolioData();
  }, [user?.id]);





  // Tüm yaklaşan ödemeleri filtrele (15 gün içindekiler)
  const allUpcomingPayments = payments
    .filter(payment => {
      const daysRemaining = calculateDaysRemaining(payment.date);
      return payment.status === 'Ödenmedi' && daysRemaining > 0 && daysRemaining <= 15;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Dashboard'da gösterilecek en yakın 4 ödeme
  // const displayedPayments = allUpcomingPayments.slice(0, 4);

  if (loading) return <LoadingSpinner />;
  if (!payments || !subscriptions) {
    return <ErrorMessage message="Veriler yüklenirken bir hata oluştu." />;
  }

  // Aylık gider hesaplamaları
  const monthlyExpenseAmount = expenses
    .filter(expense => expense.isActive)
    .reduce((sum, expense) => sum + expense.amount, 0);
    

    
  // Aylık gelir hesaplamaları
  const monthlyIncomeAmount = incomes
    .filter(income => income.isActive)
    .reduce((sum, income) => sum + income.amount, 0);
    
  // Yaklaşan giderler (ödenmemiş ve aktif)
  const upcomingExpenses = expenses
    .filter(expense => expense.isActive && !expense.isPaid)
    .slice(0, 4);
    
  // Finansal veriler hesaplamaları
  const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + card.currentDebt, 0);
  const totalCreditCardLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalCashAdvanceDebt = cashAdvanceAccounts.reduce((sum, account) => sum + account.currentDebt, 0);
  const totalCashAdvanceLimit = cashAdvanceAccounts.reduce((sum, account) => sum + account.limit, 0);
  // const totalLoanDebt = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  
  const totalLimit = totalCreditCardLimit + totalCashAdvanceLimit;
  
  // Kredi kartlarını sırala: en düşük kullanılabilir orana göre
  const sortedCreditCards = [...creditCards]
    .sort((a, b) => {
      const availableRatioA = a.limit > 0 ? ((a.limit - a.currentDebt) / a.limit) * 100 : 0;
      const availableRatioB = b.limit > 0 ? ((b.limit - b.currentDebt) / b.limit) * 100 : 0;
      return availableRatioA - availableRatioB; // En düşük kullanılabilir oran önce
    });
    
  // Ek hesaplarını sırala: en düşük kullanılabilir orana göre
  const sortedCashAdvanceAccounts = [...cashAdvanceAccounts]
    .sort((a, b) => {
      const availableRatioA = a.limit > 0 ? ((a.limit - a.currentDebt) / a.limit) * 100 : 0;
      const availableRatioB = b.limit > 0 ? ((b.limit - b.currentDebt) / b.limit) * 100 : 0;
      return availableRatioA - availableRatioB; // En düşük kullanılabilir oran önce
    });
  
  // Yaklaşan abonelik ödemeleri - süre sınırlaması olmadan en düşükten en yükseğe
  const upcomingSubscriptions = subscriptions
    .filter(sub => sub.isActive !== false) // Sadece aktif abonelikleri al
    .map(sub => ({
      ...sub,
      daysRemaining: calculateDaysRemaining(sub.endDate)
    }))
    .filter(sub => sub.daysRemaining > 0) // Sadece gelecekteki abonelikleri al
    .sort((a, b) => a.daysRemaining - b.daysRemaining) // En düşük gün sayısı önce
    .slice(0, 3);
    
  // Kargo hesaplamaları
  const recentCargos = cargoList
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
    
  const pendingCargos = cargoList.filter(cargo => !cargo.isDelivered);
  const deliveredCargos = cargoList.filter(cargo => cargo.isDelivered);
    
  // const monthlyUnpaidAmount = payments.reduce((sum, payment) => {
  //   const paymentDate = new Date(payment.date);
  //   if (
  //     payment.status === 'Ödenmedi' &&
  //     paymentDate.getMonth() === currentDate.getMonth() &&
  //     paymentDate.getFullYear() === currentDate.getFullYear()
  //   ) {
  //     return sum + payment.amount;
  //   }
  //   return sum;
  // }, 0);

  // const totalMonthlySpending = payments.reduce((sum, payment) => {
  //   const paymentDate = new Date(payment.date);
  //   if (
  //     paymentDate.getMonth() === currentDate.getMonth() &&
  //     paymentDate.getFullYear() === currentDate.getFullYear()
  //   ) {
  //     return sum + payment.amount;
  //   }
  //   return sum;
  // }, 0);

  const stats = [
    {
      label: 'Aylık Gelir',
      value: formatCurrency(monthlyIncomeAmount),
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: `${incomes.filter(i => i.isActive).length} kaynak`,
      onClick: () => navigate('/incomes')
    },
    {
      label: 'Aylık Gider',
      value: formatCurrency(monthlyExpenseAmount),
      icon: Target,
      color: 'bg-red-500',
      trend: `${expenses.filter(e => e.isActive).length} kalem`,
      onClick: () => navigate('/expenses')
    },
    {
      label: 'Kullanılabilir Limit',
      value: formatCurrency(totalLimit - totalCreditCardDebt - totalCashAdvanceDebt),
      icon: PiggyBank,
      color: 'bg-orange-500',
      trend: `${creditCards.length + cashAdvanceAccounts.length} kart/hesap`,
      onClick: () => navigate('/financial')
    },
    {
      label: 'Portföy Değeri',
      value: portfolioSummary ? formatCurrency(portfolioSummary.totalValue) : '₺0',
      icon: DollarSign,
      color: portfolioSummary && portfolioSummary.totalGainLoss >= 0 ? 'bg-green-600' : 'bg-red-600',
      trend: portfolioSummary ? `${portfolioItems.length} yatırım` : 'Yatırım yok',
      onClick: () => navigate('/portfolio')
    },
    {
      label: 'Net Durum',
      value: formatCurrency(monthlyIncomeAmount - monthlyExpenseAmount),
      icon: Clock,
      color: monthlyIncomeAmount >= monthlyExpenseAmount ? 'bg-green-600' : 'bg-red-600',
      trend: monthlyIncomeAmount >= monthlyExpenseAmount ? 'Pozitif' : 'Negatif',
      onClick: () => navigate('/dashboard') // Net durum için dashboard'da kalır
    },
    {
      label: 'Aktif Abonelik',
      value: subscriptions.length.toString(),
      icon: Calendar,
      color: 'bg-yellow-500',
      trend: formatCurrency(subscriptions.reduce((sum, sub) => sum + sub.price, 0)),
      onClick: () => navigate('/subscriptions')
    }
  ];



  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#ffb700] via-[#ff8f00] to-[#e6a500] rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-[#ffb700]/20 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
              Hoş Geldin {user?.fullName?.split(' ')[0] || 'Ersin'} 👋
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Finansal durumunuzun özeti
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full backdrop-blur-sm">
            <div className="text-2xl lg:text-4xl">📊</div>
          </div>
        </div>
      </div>



      {/* Traditional Alerts */}
      <Alerts 
        upcomingPayments={allUpcomingPayments}
        expiringSubscriptions={subscriptions.filter(s => {
          const daysRemaining = calculateDaysRemaining(s.endDate);
          return daysRemaining <= 7 && daysRemaining > 0;
        })}
      />

      {/* Uygulama Seçici */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8">
        {/* TeknoFinans */}
        <div 
          onClick={() => navigate('/financial')}
          className="group bg-white border-2 border-[#ffb700] rounded-2xl p-4 sm:p-6 text-gray-800 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#e6a500] hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#ffb700] to-[#e6a500] p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold group-hover:scale-110 transition-transform">💰</div>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[#e6a500] transition-colors">TeknoFinans</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-4">Finansal verilerinizi analiz edin</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Kredi Kartları</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Avans Hesapları</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Krediler</span>
          </div>
        </div>

        {/* TeknoKapsül */}
        <div 
          onClick={() => navigate('/teknokapsul')}
          className="group bg-white border-2 border-[#ffb700] rounded-2xl p-4 sm:p-6 text-gray-800 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#e6a500] hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#ffb700] to-[#e6a500] p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <Apps className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold group-hover:scale-110 transition-transform">📦</div>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[#e6a500] transition-colors">TeknoKapsül</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-4">Dijital yaşam araçları</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Kargo Takip</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Abonelik Yönetimi</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Garanti Takip</span>
          </div>
        </div>

        {/* TeknoHizmet */}
        <div 
          onClick={() => navigate('/services')}
          className="group bg-white border-2 border-[#ffb700] rounded-2xl p-4 sm:p-6 text-gray-800 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#e6a500] hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-[#ffb700] to-[#e6a500] p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold group-hover:scale-110 transition-transform">🔧</div>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[#e6a500] transition-colors">TeknoHizmet</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-4">Profesyonel hizmet ağı</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Ev Hizmetleri</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Otomotiv</span>
            <span className="bg-[#ffb700]/20 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">Güzellik</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <div key={index} onClick={stat.onClick} className="group bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-lg border border-gray-100 hover:border-[#ffb700]/30 transition-all duration-300 animate-bounce-in cursor-pointer" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${stat.color} text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{stat.label}</p>
              <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-[#e6a500] transition-colors">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>



      {/* Portföy - Tam Genişlik */}
      <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/portfolio')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Portföy</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/portfolio');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
            >
              Tümünü Gör <ExternalLink className="w-3 h-3" />
            </button>
            <div className="p-2 bg-gradient-to-br from-[#ffb700] to-[#e6a500] rounded-xl shadow-sm">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {portfolioItems.length > 0 ? (
            <>
              {/* Toplam TL Değeri */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-blue-800 mb-2">Toplam TL</h3>
                  <div className="text-lg font-bold text-blue-900">
                    {portfolioSummary ? formatCurrency(portfolioSummary.totalValue) : '₺0'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {portfolioItems.length} yatırım
                  </div>
                </div>
              </div>
              
              {/* ABD Doları */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-green-800 mb-2">ABD Doları</h3>
                  <div className="text-lg font-bold text-green-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'currency' && item.symbol === 'USD').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'currency' && item.symbol === 'USD').length} adet
                  </div>
                </div>
              </div>
              
              {/* Euro */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-yellow-800 mb-2">Euro</h3>
                  <div className="text-lg font-bold text-yellow-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'currency' && item.symbol === 'EUR').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'currency' && item.symbol === 'EUR').length} adet
                  </div>
                </div>
              </div>
              
              {/* Altın */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-yellow-800 mb-2">Altın</h3>
                  <div className="text-lg font-bold text-yellow-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'gold').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'gold').length} adet
                  </div>
                </div>
              </div>
              
              {/* Fon */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-indigo-800 mb-2">Fon</h3>
                  <div className="text-lg font-bold text-indigo-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'fund').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'fund').length} adet
                  </div>
                </div>
              </div>
              
              {/* Hisse Senedi */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-red-800 mb-2">Hisse</h3>
                  <div className="text-lg font-bold text-red-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'stock').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'stock').length} adet
                  </div>
                </div>
              </div>
              
              {/* Vadeli Hesap */}
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-teal-800 mb-2">Vadeli Hesap</h3>
                  <div className="text-lg font-bold text-teal-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'deposit').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-teal-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'deposit').length} adet
                  </div>
                </div>
              </div>
              
              {/* Kripto Para */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-center">
                  <h3 className="font-medium text-sm text-orange-800 mb-2">Kripto Para</h3>
                  <div className="text-lg font-bold text-orange-900">
                    {formatCurrency(portfolioItems.filter(item => item.type === 'crypto').reduce((sum, item) => sum + item.totalValue, 0))}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {portfolioItems.filter(item => item.type === 'crypto').length} adet
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base">Portföy öğesi bulunmuyor</p>
              <p className="text-sm mt-2">İlk yatırımınızı ekleyerek başlayın</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Kredi Kartları */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/financial')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Kredi Kartları</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/financial');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-[#ffb700] to-[#e6a500] rounded-xl shadow-sm">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
             {sortedCreditCards.length > 0 ? sortedCreditCards.slice(0, 3).map((card) => {
               const availableRatio = card.limit > 0 ? ((card.limit - card.currentDebt) / card.limit) * 100 : 0;
               const daysToPayment = calculateDaysRemaining(new Date(new Date().getFullYear(), new Date().getMonth(), card.statementDate).toISOString());
               return (
                 <div key={card.id} className="p-3 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="font-medium text-sm truncate">{card.name}</h3>
                     <div className="flex gap-1">
                       <span className={`text-xs px-2 py-1 rounded-full ${
                         availableRatio >= 80 ? 'bg-green-100 text-green-800' :
                         availableRatio >= 50 ? 'bg-orange-100 text-orange-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         %{availableRatio.toFixed(0)}
                       </span>
                       {daysToPayment <= 7 && daysToPayment > 0 && (
                         <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                           {daysToPayment} gün
                         </span>
                       )}
                     </div>
                   </div>
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>Kullanılabilir: {formatCurrency(card.limit - card.currentDebt)}</span>
                     <span>Limit: {formatCurrency(card.limit)}</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                     <div 
                       className={`h-2 rounded-full ${
                         availableRatio >= 80 ? 'bg-green-500' :
                         availableRatio >= 50 ? 'bg-orange-500' :
                         'bg-red-500'
                       }`}
                       style={{ width: `${Math.min(availableRatio, 100)}%` }}
                     ></div>
                   </div>
                 </div>
               );
             }) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Kredi kartı bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Ek Hesapları */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/financial')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Ek Hesapları</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/financial');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm">
                <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
             {sortedCashAdvanceAccounts.length > 0 ? sortedCashAdvanceAccounts.slice(0, 3).map((account) => {
               const availableRatio = account.limit > 0 ? ((account.limit - account.currentDebt) / account.limit) * 100 : 0;
               return (
                 <div key={account.id} className="p-3 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="font-medium text-sm truncate">{account.name}</h3>
                     <div className="flex gap-1">
                       <span className={`text-xs px-2 py-1 rounded-full ${
                         availableRatio >= 80 ? 'bg-green-100 text-green-800' :
                         availableRatio >= 50 ? 'bg-orange-100 text-orange-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         %{availableRatio.toFixed(0)}
                       </span>
                     </div>
                   </div>
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>Kullanılabilir: {formatCurrency(account.limit - account.currentDebt)}</span>
                     <span>Limit: {formatCurrency(account.limit)}</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                     <div 
                       className={`h-2 rounded-full ${
                         availableRatio >= 80 ? 'bg-green-500' :
                         availableRatio >= 50 ? 'bg-orange-500' :
                         'bg-red-500'
                       }`}
                       style={{ width: `${Math.min(availableRatio, 100)}%` }}
                     ></div>
                   </div>
                 </div>
               );
             }) : (
              <div className="text-center py-8 text-muted-foreground">
                <Banknote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Avans hesabı bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Krediler */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/financial')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Krediler</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/financial');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {loans.length > 0 ? loans.slice(0, 3).map((loan) => {
               const paidRatio = loan.totalAmount > 0 && !isNaN(loan.totalAmount) && !isNaN(loan.remainingAmount) 
                 ? ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100 
                 : 0;
               return (
                 <div key={loan.id} className="p-3 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="font-medium text-sm truncate">{loan.name}</h3>
                     <span className="text-xs px-2 py-1 rounded-full text-white" style={{ 
                       backgroundColor: paidRatio >= 80 ? '#10b981' : paidRatio >= 50 ? '#f59e0b' : '#ef4444'
                     }}>
                       %{isNaN(paidRatio) ? 0 : paidRatio.toFixed(0)} ödendi
                     </span>
                   </div>
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>Kalan: {formatCurrency(loan.remainingAmount || 0)}</span>
                     <span>Toplam: {formatCurrency(loan.totalAmount || 0)}</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                     <div 
                       className="h-2 rounded-full"
                       style={{ 
                         backgroundColor: paidRatio >= 80 ? '#10b981' : paidRatio >= 50 ? '#f59e0b' : '#ef4444',
                         width: `${Math.min(isNaN(paidRatio) ? 0 : paidRatio, 100)}%`
                       }}
                     ></div>
                   </div>
                 </div>
               );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Kredi bulunmuyor</p>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* Yaklaşan Ödemeler ve Abonelikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Yaklaşan Ödemeler */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/expenses')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Yaklaşan Ödemeler</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/expenses');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
         
         <div className="space-y-3">
           {upcomingExpenses.length > 0 ? (
             upcomingExpenses.map((expense) => (
               <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                 <div className="flex-1 min-w-0">
                   <h4 className="font-medium text-sm truncate text-red-800">{expense.title}</h4>
                   <p className="text-xs text-red-600">
                     {new Date(expense.date).toLocaleDateString('tr-TR')}
                   </p>
                 </div>
                 <span className="font-medium text-red-700 text-sm">
                   {formatCurrency(expense.amount)}
                 </span>
               </div>
             ))
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm">Yaklaşan ödeme bulunmuyor</p>
               <p className="text-xs mt-1">Tüm ödemeleriniz güncel!</p>
             </div>
           )}
         </div>
       </div>

        {/* Yaklaşan Abonelikler */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/subscriptions')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Yaklaşan Abonelikler</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/subscriptions');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
         
         <div className="space-y-3">
           {upcomingSubscriptions.length > 0 ? (
             upcomingSubscriptions.map((subscription) => {
               return (
                 <div key={subscription.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                   <div className="flex-1 min-w-0">
                     <h4 className="font-medium text-sm truncate text-yellow-800">{subscription.name}</h4>
                     <p className="text-xs text-yellow-600">
                       {subscription.daysRemaining} gün kaldı • {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                     </p>
                     <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                       subscription.daysRemaining <= 3 ? 'bg-red-100 text-red-800' :
                       subscription.daysRemaining <= 7 ? 'bg-orange-100 text-orange-800' :
                       'bg-green-100 text-green-800'
                     }`}>
                       {subscription.daysRemaining <= 3 ? 'Acil' : subscription.daysRemaining <= 7 ? 'Yakında' : 'Normal'}
                     </span>
                   </div>
                   <span className="font-medium text-yellow-700 text-sm">
                     {formatCurrency(subscription.price)}
                   </span>
                 </div>
               );
             })
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm">Yaklaşan abonelik bulunmuyor</p>
               <p className="text-xs mt-1">Tüm abonelikleriniz güncel!</p>
             </div>
           )}
          </div>
        </div>
      </div>

      {/* Son Kargolar ve Kargo Durumu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Son Kargolarınız */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5" onClick={() => navigate('/cargo-tracking')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Son Kargolarınız</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/cargo-tracking');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
         
         <div className="space-y-3">
           {recentCargos.length > 0 ? (
             recentCargos.slice(0, 3).map((cargo) => {
               const company = CARGO_COMPANIES[cargo.company];
               return (
                 <div key={cargo.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                   <div className="flex items-center gap-3 flex-1 min-w-0">
                     {company?.logo ? (
                       <img 
                         src={company.logo} 
                         alt={company.name}
                         className="w-6 h-6 object-contain rounded flex-shrink-0"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                     ) : null}
                     <Truck className={`w-5 h-5 text-orange-600 flex-shrink-0 ${company?.logo ? 'hidden' : ''}`} />
                     <div className="flex-1 min-w-0">
                       <h4 className="font-medium text-sm truncate text-orange-800">{cargo.name}</h4>
                       <p className="text-xs text-orange-600 truncate">
                         {cargo.trackingNumber} • {company?.name || cargo.company}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 flex-shrink-0">
                     {cargo.isDelivered ? (
                       <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                         Teslim Edildi
                       </span>
                     ) : (
                       <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                         Bekliyor
                       </span>
                     )}
                   </div>
                 </div>
               );
             })
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm">Henüz kargo eklenmemiş</p>
               <p className="text-xs mt-1">İlk kargonuzu ekleyerek başlayın!</p>
             </div>
           )}
         </div>
       </div>

        {/* Kargo Durumu */}
        <div className="group bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">Kargo Durumu</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/cargo-tracking')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                Tümünü Gör <ExternalLink className="w-3 h-3" />
              </button>
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
         
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => navigate('/cargo-tracking')}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm text-green-800">Teslim Edilen</p>
                  <p className="text-xs text-green-600">Başarıyla ulaştı</p>
                </div>
              </div>
              <span className="font-bold text-lg text-green-700">{deliveredCargos.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => navigate('/cargo-tracking')}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm text-yellow-800">Bekleyen</p>
                  <p className="text-xs text-yellow-600">Yolda olan kargolar</p>
                </div>
              </div>
              <span className="font-bold text-lg text-yellow-700">{pendingCargos.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate('/cargo-tracking')}>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm text-blue-800">Toplam Kargo</p>
                  <p className="text-xs text-blue-600">Tüm takipleriniz</p>
                </div>
              </div>
              <span className="font-bold text-lg text-blue-700">{cargoList.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Önerileri - Tam Genişlik */}
      <div className="group bg-white rounded-2xl p-4 sm:p-6 min-h-[300px] border border-gray-100 hover:border-[#ffb700]/30 hover:bg-gradient-to-br hover:from-white hover:to-[#ffb700]/5 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#e6a500] transition-colors">AI Önerileri</h2>
          <div className="p-2 bg-gradient-to-br from-[#ffb700] to-[#e6a500] rounded-xl shadow-sm">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
        <div className="space-y-4 min-h-[200px]">
          {aiLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: '#ffb700' }}></div>
              <p className="text-sm text-muted-foreground mt-4">AI önerileri hazırlanıyor...</p>
            </div>
          ) : aiRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiRecommendations.slice(0, 6).map((recommendation, index) => (
                <div key={index} className="p-4 rounded-lg min-h-[80px] flex items-center" style={{ backgroundColor: '#fff8e1', border: '1px solid #ffb700' }}>
                  <p className="text-sm leading-relaxed" style={{ color: '#e65100' }}>{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base">AI önerileri şu anda mevcut değil</p>
              <p className="text-sm mt-2">Portföyünüze yatırım ekleyerek AI önerilerini görüntüleyebilirsiniz</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};