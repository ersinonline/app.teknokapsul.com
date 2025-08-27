import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, PiggyBank, DollarSign, Clock, Calendar, Package, Wrench, CreditCard, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserExpenses } from '../services/expense.service';
import { getUserIncomes } from '../services/income.service';
import { getUserSubscriptions } from '../services/subscription.service';
import { getCreditCards, getCashAdvanceAccounts } from '../services/financial.service';
import { portfolioService } from '../services/portfolio.service';
import { formatCurrency } from '../utils/currency';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { Subscription } from '../types/subscription';
import { CreditCard as CreditCardType, CashAdvanceAccount } from '../types/financial';
import { PortfolioItem, PortfolioSummary } from '../types/portfolio';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [cashAdvanceAccounts, setCashAdvanceAccounts] = useState<CashAdvanceAccount[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const [userExpenses, userIncomes, userSubscriptions, userCreditCards, userCashAdvanceAccounts] = await Promise.all([
          getUserExpenses(user.id, currentYear, currentMonth),
          getUserIncomes(user.id, currentYear, currentMonth),
          getUserSubscriptions(user.id),
          getCreditCards(user.id),
          getCashAdvanceAccounts(user.id)
        ]);
        
        setExpenses(userExpenses);
        setIncomes(userIncomes);
        setSubscriptions(userSubscriptions);
        setCreditCards(userCreditCards);
        setCashAdvanceAccounts(userCashAdvanceAccounts);
        
        // Portföy verilerini yükle
        const items = await portfolioService.getPortfolioItems(user.id);
        setPortfolioItems(items);
        
        const consolidatedItems = portfolioService.consolidatePortfolioBySymbol(items);
        const summary = portfolioService.calculatePortfolioSummary(consolidatedItems);
        setPortfolioSummary(summary);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, currentYear, currentMonth]);
  
  // Finansal hesaplamalar
  const monthlyExpenseAmount = expenses
    .filter(expense => expense.isActive)
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const monthlyIncomeAmount = incomes
    .filter(income => income.isActive)
    .reduce((sum, income) => sum + income.amount, 0);
    
  const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + card.currentDebt, 0);
  const totalCreditCardLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalCashAdvanceDebt = cashAdvanceAccounts.reduce((sum, account) => sum + account.currentDebt, 0);
  const totalCashAdvanceLimit = cashAdvanceAccounts.reduce((sum, account) => sum + account.limit, 0);
  
  const totalLimit = totalCreditCardLimit + totalCashAdvanceLimit;
  const availableLimit = totalLimit - totalCreditCardDebt - totalCashAdvanceDebt;
  
  const netAmount = monthlyIncomeAmount - monthlyExpenseAmount;
  
  const financialStats = [
    {
      title: 'Aylık Gelir',
      value: formatCurrency(monthlyIncomeAmount),
      change: `${incomes.filter(i => i.isActive).length} kaynak`,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Aylık Gider',
      value: formatCurrency(monthlyExpenseAmount),
      change: `${expenses.filter(e => e.isActive).length} kalem`,
      icon: Target,
      color: 'text-red-600'
    },
    {
      title: 'Kullanılabilir Limit',
      value: formatCurrency(availableLimit),
      change: `${creditCards.length + cashAdvanceAccounts.length} kart/hesap`,
      icon: PiggyBank,
      color: 'text-blue-600'
    },
    {
      title: 'Portföy Değeri',
      value: portfolioSummary ? formatCurrency(portfolioSummary.totalValue) : '₺0,00',
      change: `${portfolioItems.length} yatırım`,
      icon: DollarSign,
      color: portfolioSummary && portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Net Durum',
      value: formatCurrency(netAmount),
      change: netAmount >= 0 ? 'Pozitif' : 'Negatif',
      icon: Clock,
      color: netAmount >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Aktif Abonelik',
      value: subscriptions.length.toString(),
      change: formatCurrency(subscriptions.reduce((sum, sub) => sum + sub.price, 0)),
      icon: Calendar,
      color: 'text-yellow-600'
    }
  ];

  const quickActions = [
    {
      id: 'add-expense',
      title: 'Hızlı Gider Ekle',
      description: 'Yeni gider kaydı oluştur',
      icon: Plus,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverBgColor: 'hover:bg-red-100',
      route: '/expenses'
    },
    {
      id: 'add-income',
      title: 'Gelir Ekle',
      description: 'Yeni gelir kaydı oluştur',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBgColor: 'hover:bg-green-100',
      route: '/incomes'
    },
    {
      id: 'view-reports',
      title: 'Raporları Görüntüle',
      description: 'Finansal raporlarınızı inceleyin',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'hover:bg-blue-100',
      route: '/financial'
    },
    {
      id: 'manage-subscriptions',
      title: 'Abonelikler',
      description: 'Aboneliklerinizi yönetin',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'hover:bg-purple-100',
      route: '/subscriptions'
    }
  ];

  const applications = [
    {
      id: 'teknokapsul',
      title: 'TeknoKapsül',
      description: 'Kargo takibi ve lojistik yönetimi',
      icon: Package,
      gradient: 'from-orange-500 to-red-500',
      hoverGradient: 'hover:from-orange-600 hover:to-red-600',
      route: '/tekno-kapsul',
      features: ['Kargo Takibi', 'Teslimat Bildirimleri', 'Çoklu Kargo Firması']
    },
    {
      id: 'teknohizmet',
      title: 'TeknoHizmet',
      description: 'Teknik destek ve hizmet yönetimi',
      icon: Wrench,
      gradient: 'from-blue-500 to-indigo-500',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-600',
      route: '/tekno-hizmet',
      features: ['Destek Talepleri', 'Hizmet Takibi', 'Teknik Yardım']
    },
    {
      id: 'teknofinans',
      title: 'TeknoFinans',
      description: 'Finansal analiz ve portföy yönetimi',
      icon: CreditCard,
      gradient: 'from-green-500 to-teal-500',
      hoverGradient: 'hover:from-green-600 hover:to-teal-600',
      route: '/tekno-finans',
      features: ['Portföy Analizi', 'Gelir-Gider Takibi', 'Yatırım Önerileri']
    }
  ];

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-[#ffb700] flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#ffb700] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-md border-b border-white/10 px-6 py-6 flex-shrink-0">
        <div className="w-full">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Hoş Geldiniz, <span className="text-[#ffb700]">{user?.firstName || 'Kullanıcı'}</span>
            </h1>
            <p className="text-white/90 text-base leading-relaxed">
              TeknoKapsül ekosisteminde finansal durumunuzu takip edin ve hizmetlerimizi keşfedin
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-between overflow-hidden max-w-7xl mx-auto">
        {/* Financial Stats Section */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">Finansal Durum</h2>
            <p className="text-white/80 text-base">Güncel finansal verilerinizin özeti</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {financialStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate('/financial')}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 ${stat.color} bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300`}>
                     <IconComponent className="w-5 h-5" />
                   </div>
                   <h3 className="text-xs font-semibold text-gray-800 mb-2 leading-tight">{stat.title}</h3>
                   <p className="text-base font-bold text-gray-900 mb-1">{stat.value}</p>
                   <p className={`text-xs font-medium text-[#ffb700] bg-[#ffb700]/10 px-2 py-1 rounded-full`}>{stat.change}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">Hızlı İşlemler</h2>
            <p className="text-white/80 text-base">Sık kullanılan işlemlerinizi hızlıca gerçekleştirin</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={action.id}
                  className={`${action.bgColor} ${action.hoverBgColor} border border-white/20 rounded-xl p-4 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group`}
                  onClick={() => navigate(action.route)}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 ${action.color} bg-white rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 leading-tight">{action.title}</h3>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">Hizmetlerimiz</h2>
            <p className="text-white/80 text-base">İhtiyacınıza uygun hizmeti seçin ve hemen başlayın</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
            {applications.map((app) => {
              const IconComponent = app.icon;
              return (
                <div
                  key={app.id}
                  className="group bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col min-h-0"
                  onClick={() => navigate(app.route)}
                >
                  <div className="bg-gradient-to-br from-[#ffb700] to-[#e6a500] rounded-xl p-5 mb-4 text-center shadow-lg">
                    <IconComponent className="w-10 h-10 text-white mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-base font-bold text-white mb-2 leading-tight">{app.title}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">{app.description}</p>
                  </div>
                  
                  <div className="space-y-3 flex-1 min-h-0 overflow-hidden">
                    <h4 className="font-semibold text-gray-800 mb-3 text-base">Özellikler:</h4>
                    <div className="space-y-2 max-h-24 overflow-hidden">
                      {app.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start text-gray-600">
                          <div className="w-2 h-2 bg-[#ffb700] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};