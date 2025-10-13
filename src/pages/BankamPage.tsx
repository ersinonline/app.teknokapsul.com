import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart, 
  BarChart3, 
  Database, 
  CreditCard, 
  Calculator,
  Calendar,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

const BankamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Firebase'den gerçek verileri çek
  const { data: goals, loading: goalsLoading } = useFirebaseData('goals');
  
  // Gelir ve gider verileri için ayrı state ve fetch fonksiyonları
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) {
        setExpenses([]);
        setIncomes([]);
        setRecentTransactions([]);
        setLoading(false);
        return;
      }

      try {
        // Giderleri çek
        const expensesRef = collection(db, 'teknokapsul', user.id, 'expenses');
        const expensesQuery = query(
          expensesRef, 
          where('isActive', '==', true),
          orderBy('date', 'desc'),
          limit(50)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const expensesData = expensesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];

        // Gelirleri çek
        const incomesRef = collection(db, 'teknokapsul', user.id, 'incomes');
        const incomesQuery = query(
          incomesRef, 
          where('isActive', '==', true),
          orderBy('date', 'desc'),
          limit(50)
        );
        const incomesSnapshot = await getDocs(incomesQuery);
        const incomesData = incomesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Income[];

        setExpenses(expensesData);
        setIncomes(incomesData);

        // Son işlemleri birleştir ve sırala
        const allTransactions: Transaction[] = [
          ...expensesData.slice(0, 5).map(expense => ({
            id: expense.id,
            title: expense.title,
            amount: expense.amount,
            date: expense.date,
            type: 'expense' as const
          })),
          ...incomesData.slice(0, 5).map(income => ({
            id: income.id,
            title: income.title,
            amount: income.amount,
            date: income.date,
            type: 'income' as const
          }))
        ];

        // Tarihe göre sırala ve ilk 3'ünü al
        const sortedTransactions = allTransactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

        setRecentTransactions(sortedTransactions);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        setExpenses([]);
        setIncomes([]);
        setRecentTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [user]);

  // Bu ayın verilerini hesapla
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const thisMonthIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Aktif hedefleri filtrele ve tip güvenliği için Goal interface'ini import et
  const activeGoals = goals.filter((goal: any) => goal.status === 'active');
  const goalProgress = activeGoals.length > 0 
    ? Math.round((activeGoals.reduce((sum: number, goal: any) => sum + (goal.currentAmount / goal.targetAmount), 0) / activeGoals.length) * 100)
    : 0;

  const financialSections = [
    {
      id: 'income',
      title: 'Gelirlerim',
      description: 'Tüm gelir kaynaklarınızı takip edin',
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      route: '/income'
    },
    {
      id: 'expenses',
      title: 'Giderlerim',
      description: 'Harcamalarınızı analiz edin',
      icon: TrendingDown,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      route: '/expenses'
    },
    {
      id: 'goals',
      title: 'Hedeflerim',
      description: 'Finansal hedeflerinizi belirleyin',
      icon: Target,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      route: '/goals'
    },
    {
      id: 'portfolio',
      title: 'Portföyüm',
      description: 'Yatırım portföyünüzü yönetin',
      icon: PieChart,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      route: '/portfolio'
    },
    {
      id: 'stock-tracking',
      title: 'Borsa Takibi',
      description: 'Borsa verilerini takip edin',
      icon: BarChart3,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      route: '/stock-market'
    },
    {
      id: 'financial-data',
      title: 'Finansal Verilerim',
      description: 'Finansal verilerinizi görüntüleyin',
      icon: Database,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      route: '/financial-data'
    },
    {
      id: 'findeks',
      title: 'Findeks Kredi Notu',
      description: 'Kredi notunuzu öğrenin',
      icon: CreditCard,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      route: '/credit-score'
    },
    {
      id: 'credit-calculator',
      title: 'Kredi Hesaplama',
      description: 'Kredi hesaplamalarınızı yapın',
      icon: Calculator,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      borderColor: 'border-teal-200',
      route: '/credit-calculator'
    },
    {
      id: 'payment-plan',
      title: 'Ödeme Planı',
      description: 'Ödeme planlarınızı oluşturun',
      icon: Calendar,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200',
      route: '/payment-plan'
    }
  ];

  const quickStats = [
    { 
      label: 'Toplam Gelir', 
      value: loading ? '...' : `₺${totalIncome.toLocaleString('tr-TR')}`, 
      color: 'text-green-600' 
    },
    { 
      label: 'Toplam Gider', 
      value: loading ? '...' : `₺${totalExpense.toLocaleString('tr-TR')}`, 
      color: 'text-red-600' 
    },
    { 
      label: 'Net Bakiye', 
      value: loading ? '...' : `₺${netBalance.toLocaleString('tr-TR')}`, 
      color: netBalance >= 0 ? 'text-blue-600' : 'text-red-600' 
    },
    { 
      label: 'Hedef İlerleme', 
      value: goalsLoading ? '...' : `%${goalProgress}`, 
      color: 'text-purple-600' 
    }
  ];

  const handleSectionClick = (route: string) => {
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" style={{ color: '#ffb700' }} />
              <h1 className="text-2xl font-bold text-gray-900">Bankam</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Finansal Özet
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Sections */}
        <div className="grid grid-cols-1 gap-4">
          {financialSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.route)}
                className={`${section.bgColor} ${section.borderColor} border rounded-xl p-6 cursor-pointer hover:shadow-md transition-all duration-300 group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${section.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${section.textColor} text-lg`}>
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${section.textColor} group-hover:translate-x-1 transition-transform duration-300`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Son İşlemler</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz işlem bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankamPage;