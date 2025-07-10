import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, PieChart } from 'lucide-react';
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
          getUserIncomes(user.uid),
          getUserExpenses(user.uid)
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
      id: 'portfolio',
      title: 'Kredi Hesaplama',
      description: 'Kredilerinizi hesaplayın',
      icon: PieChart,
      path: '/loan-calculator',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-transparent">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Finans</h1>
          <p className="text-gray-600 mt-1">Finansal durumunuzu yönetin</p>
        </div>
      </div>

      {/* Finance Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {financeItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <div className="text-center space-y-3">
                  <div className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto`}>
                    <Icon className={`w-7 h-7 ${item.textColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-2">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-sm border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bu Ay Özeti</h3>
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
             <div className="border-t border-blue-200 pt-3">
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