import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, PieChart, FileText, Target, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserIncomes } from '../../services/income.service';
import { getUserExpenses } from '../../services/expense.service';
import { Income } from '../../types/income';
import { Expense } from '../../types/expense';

export const MobileFinancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Fetch current month's income and expenses
        const [incomes, expenses] = await Promise.all([
          getUserIncomes(user.id),
          getUserExpenses(user.id)
        ]);
        
        // Filter for current month
        const currentMonthIncomes = incomes.filter((income: Income) => {
          const incomeDate = new Date(income.date);
          return incomeDate.getMonth() + 1 === currentMonth && incomeDate.getFullYear() === currentYear;
        });
        
        const currentMonthExpenses = expenses.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear;
        });
        
        // Calculate totals
        const incomeTotal = currentMonthIncomes.reduce((sum: number, income: Income) => sum + income.amount, 0);
        const expenseTotal = currentMonthExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        
        setTotalIncome(incomeTotal);
        setTotalExpense(expenseTotal);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const financeItems = [
    {
      id: 'income',
      title: 'Gelirlerim',
      description: 'Aylık gelirlerinizi takip edin',
      icon: TrendingUp,
      path: '/income',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'expenses',
      title: 'Giderlerim',
      description: 'Harcamalarınızı kontrol edin',
      icon: TrendingDown,
      path: '/expenses',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      id: 'financial-data',
      title: 'Finansal Veriler',
      description: 'Detaylı finansal analizler',
      icon: CreditCard,
      path: '/financial-data',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'portfolio',
      title: 'Portföyüm',
      description: 'Yatırım portföyünüzü yönetin',
      icon: PieChart,
      path: '/portfolio',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'credit-calculator',
      title: 'Kredi Hesaplama',
      description: 'Kredilerinizi hesaplayın',
      icon: PieChart,
      path: '/credit-calculator',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'credit-score',
      title: 'Findeks Risk Raporu',
      description: 'Kredi notunuzu takip edin',
      icon: FileText,
      path: '/credit-score',
      color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700'
    },
    {
      id: 'stock-market',
      title: 'Borsa',
      description: 'Borsa İstanbul verilerini takip edin',
      icon: BarChart3,
      path: '/stock-market',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      id: 'goals',
      title: 'Hedeflerim',
      description: 'Finansal hedeflerinizi takip edin',
      icon: Target,
      path: '/goals',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-transparent rounded-b-lg">
        <div className="px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">💰 TeknoFinans</h1>
          <p className="text-gray-600 mt-2 text-lg">Finansal araçlarınız</p>
        </div>
      </div>

      {/* Finance Cards */}
      <div className="px-4 py-6 -mt-4">
        <div className="grid grid-cols-1 gap-4">
          {financeItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-lg p-5 border border-gray-200 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-2">
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h3 className="text-xl font-bold text-gray-900">Bu Ay Özeti</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-gray-600">Toplam Gelir</span>
               <span className="text-lg font-bold text-green-600">
                 {loading ? '...' : `₺${totalIncome.toLocaleString('tr-TR')}`}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-gray-600">Toplam Gider</span>
               <span className="text-lg font-bold text-red-600">
                 {loading ? '...' : `₺${totalExpense.toLocaleString('tr-TR')}`}
               </span>
             </div>
             <div className="border-t border-orange-200 pt-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-700 font-medium">Net Durum</span>
                 <span className={`text-xl font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {loading ? '...' : `₺${(totalIncome - totalExpense).toLocaleString('tr-TR')}`}
                 </span>
               </div>
             </div>
           </div>
           {!loading && totalIncome === 0 && totalExpense === 0 && (
             <div className="mt-4 text-center">
               <p className="text-xs text-gray-500">Bu ay henüz gelir veya gider kaydı bulunmuyor</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MobileFinancePage;