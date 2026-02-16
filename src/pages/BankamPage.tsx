import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Target, PieChart, BarChart3, 
  CreditCard, Calculator, Calendar, ChevronRight,
  ArrowUpRight, ArrowDownRight, Wallet
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
  const { data: goals, loading: goalsLoading } = useFirebaseData('goals');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const expensesRef = collection(db, 'teknokapsul', user.id, 'expenses');
        const expQ = query(expensesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const expSnap = await getDocs(expQ);
        const expData = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];

        const incomesRef = collection(db, 'teknokapsul', user.id, 'incomes');
        const incQ = query(incomesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const incSnap = await getDocs(incQ);
        const incData = incSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];

        setExpenses(expData);
        setIncomes(incData);

        const allTx: Transaction[] = [
          ...expData.slice(0, 5).map(e => ({ id: e.id, title: e.title, amount: e.amount, date: e.date, type: 'expense' as const })),
          ...incData.slice(0, 5).map(i => ({ id: i.id, title: i.title, amount: i.amount, date: i.date, type: 'income' as const }))
        ];
        setRecentTransactions(allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
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
  const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const thisMonthExp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
  const thisMonthInc = incomes.filter(i => { const d = new Date(i.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
  const totalIncome = thisMonthInc.reduce((s, i) => s + i.amount, 0);
  const totalExpense = thisMonthExp.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const activeGoals = goals.filter((g: any) => g.status === 'active');
  const goalProgress = activeGoals.length > 0
    ? Math.round((activeGoals.reduce((s: number, g: any) => s + (g.currentAmount / g.targetAmount), 0) / activeGoals.length) * 100)
    : 0;

  const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const menuItems = [
    { icon: TrendingUp, label: 'Gelirlerim', desc: 'Gelir kaynaklarınızı takip edin', route: '/income', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: TrendingDown, label: 'Giderlerim', desc: 'Harcamalarınızı analiz edin', route: '/expenses', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Target, label: 'Hedeflerim', desc: 'Finansal hedeflerinizi belirleyin', route: '/goals', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: PieChart, label: 'Portföyüm', desc: 'Yatırım portföyünüzü yönetin', route: '/portfolio', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: BarChart3, label: 'Borsa Takibi', desc: 'Borsa verilerini takip edin', route: '/stock-market', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { icon: CreditCard, label: 'Kredi Notu', desc: 'Findeks kredi notunuzu öğrenin', route: '/credit-score', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Calculator, label: 'Kredi Hesaplama', desc: 'Kredi hesaplamalarınızı yapın', route: '/credit-calculator', color: 'text-teal-500', bg: 'bg-teal-50' },
    { icon: Calendar, label: 'Ödeme Planı', desc: 'Ödeme planlarınızı oluşturun', route: '/payment-plan', color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="page-container bg-background">
      {/* Summary Header */}
      <div className="bank-gradient-blue px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider font-medium">{monthName}</p>
              <p className={`text-3xl font-bold mt-1 ${netBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
                {loading ? <span className="inline-block w-32 h-8 skeleton rounded-lg" /> : fmt(netBalance)}
              </p>
              <p className="text-white/50 text-xs mt-1">Net Bakiye</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-300 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{loading ? '...' : fmt(totalIncome)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Gelir</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <ArrowDownRight className="w-4 h-4 text-red-300 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{loading ? '...' : fmt(totalExpense)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Gider</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Target className="w-4 h-4 text-amber-300 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{goalsLoading ? '...' : `%${goalProgress}`}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Hedef</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="page-content -mt-5">
        <div className="bank-card p-1 mb-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.route} onClick={() => navigate(item.route)} className="menu-item w-full">
                <div className={`menu-icon ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Son İşlemler</h2>
            <button onClick={() => navigate('/all-transactions')} className="text-xs font-medium text-primary flex items-center gap-0.5">
              Tümü <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bank-card p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 skeleton rounded-xl" />
                      <div>
                        <div className="w-24 h-4 skeleton rounded mb-1" />
                        <div className="w-16 h-3 skeleton rounded" />
                      </div>
                    </div>
                    <div className="w-16 h-4 skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Henüz işlem bulunmuyor</p>
              </div>
            ) : (
              <div>
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="flex items-center gap-3">
                      <div className={`transaction-icon ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {tx.type === 'income' 
                          ? <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                          : <ArrowDownRight className="w-5 h-5 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <span className={tx.type === 'income' ? 'transaction-amount-positive' : 'transaction-amount-negative'}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankamPage;