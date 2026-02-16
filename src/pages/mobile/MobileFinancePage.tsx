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
    {
      id: 'payment-plan',
      title: 'Ödeme Planı',
      description: 'Ev alım ödeme planları oluşturun',
      icon: CreditCard,
      path: '/tekno-finans/payment-plan',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TeknoFinans</h1>
              <p className="text-white/60 text-xs">Finansal araçlarınız</p>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-emerald-300 font-bold text-xs">{loading ? '...' : `₺${totalIncome.toLocaleString('tr-TR')}`}</p>
              <p className="text-white/50 text-[10px]">Gelir</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-red-300 font-bold text-xs">{loading ? '...' : `₺${totalExpense.toLocaleString('tr-TR')}`}</p>
              <p className="text-white/50 text-[10px]">Gider</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className={`font-bold text-xs ${(totalIncome - totalExpense) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{loading ? '...' : `₺${(totalIncome - totalExpense).toLocaleString('tr-TR')}`}</p>
              <p className="text-white/50 text-[10px]">Net</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {financeItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="bank-card p-4 w-full flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileFinancePage;