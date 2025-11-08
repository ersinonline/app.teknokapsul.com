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
  DollarSign,
  Send,
  Receipt,
  Landmark,
  PiggyBank
} from 'lucide-react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  
  const { data: goals, loading: goalsLoading } = useFirebaseData('goals');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const expensesRef = collection(db, 'teknokapsul', user.id, 'expenses');
        const expensesQuery = query(expensesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const expensesSnapshot = await getDocs(expensesQuery);
        const expensesData = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];

        const incomesRef = collection(db, 'teknokapsul', user.id, 'incomes');
        const incomesQuery = query(incomesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const incomesSnapshot = await getDocs(incomesQuery);
        const incomesData = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];

        setExpenses(expensesData);
        setIncomes(incomesData);

        const allTransactions: Transaction[] = [
          ...expensesData.map(e => ({ ...e, type: 'expense' as const })),
          ...incomesData.map(i => ({ ...i, type: 'income' as const }))
        ];

        const sortedTransactions = allTransactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setRecentTransactions(sortedTransactions);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [user]);

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

  const activeGoals = goals.filter((goal: any) => goal.status === 'active');

  const handleNavigation = (path: string) => navigate(path);

  const quickActions = [
    { label: 'Para Gönder', icon: Send, path: '/transfer' },
    { label: 'Fatura Öde', icon: Receipt, path: '/bills' },
    { label: 'Kredi Başvur', icon: Landmark, path: '/credit-application' },
    { label: 'Birikim Yap', icon: PiggyBank, path: '/savings' },
  ];

  const financialTools = [
    { title: 'Gelirlerim', icon: TrendingUp, route: '/income', color: 'text-green-500' },
    { title: 'Giderlerim', icon: TrendingDown, route: '/expenses', color: 'text-red-500' },
    { title: 'Hedeflerim', icon: Target, route: '/goals', color: 'text-blue-500' },
    { title: 'Portföyüm', icon: PieChart, route: '/portfolio', color: 'text-purple-500' },
    { title: 'Kredi Hesapla', icon: Calculator, route: '/credit-calculator', color: 'text-teal-500' },
    { title: 'Finansal Veriler', icon: Database, route: '/financial-data', color: 'text-gray-500' },
  ];

  const chartData = {
    labels: ['Gelir', 'Gider'],
    datasets: [
      {
        label: 'Bu Ay',
        data: [totalIncome, totalExpense],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Aylık Gelir Gider Özeti',
      },
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-800">Hesabım</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80">Toplam Bakiye</p>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? 'Yükleniyor...' : `₺${netBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <p className="opacity-80">Gelir</p>
              </div>
              <p className="font-semibold text-lg">
                {loading ? '...' : `+₺${totalIncome.toLocaleString('tr-TR')}`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <p className="opacity-80">Gider</p>
              </div>
              <p className="font-semibold text-lg">
                {loading ? '...' : `-₺${totalExpense.toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 text-center mb-6">
          {quickActions.map(action => (
            <div key={action.label} onClick={() => handleNavigation(action.path)} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center">
                <action.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-2">{action.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Son İşlemler</h2>
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-gray-500">Yükleniyor...</p>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">İşlem bulunmuyor.</p>
              )}
            </div>
          </div>

          {/* Monthly Summary Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Aylık Özet</h2>
            {loading ? (
              <p className="text-center text-gray-500">Yükleniyor...</p>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </div>

        {/* Financial Tools */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
           <h2 className="font-bold text-gray-800 mb-4">Finansal Araçlar</h2>
           <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {financialTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <div key={tool.title} onClick={() => handleNavigation(tool.route)} className="flex flex-col items-center justify-center text-center cursor-pointer group">
                     <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Icon className={`w-7 h-7 ${tool.color}`} />
                     </div>
                     <p className="text-xs font-semibold text-gray-600 mt-2">{tool.title}</p>
                  </div>
                );
              })}
           </div>
        </div>
      </main>
    </div>
  );
};

export default BankamPage;