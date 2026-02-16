import { useState, useEffect } from 'react';
import { Plus, CreditCard, Calendar, AlertTriangle, ChevronLeft, ChevronRight, PieChart, TrendingUp } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Expense } from '../../types/expense';
import { getUserExpenses, addExpense } from '../../services/expense.service';
import { ExpenseForm } from '../../components/expense/ExpenseForm';
import { ExpenseTable } from '../../components/expense/ExpenseTable';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';

export const ExpensePage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userExpenses = await getUserExpenses(user.id, currentYear, currentMonth);
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  useEffect(() => {
    loadExpenses();
  }, [user, currentYear, currentMonth]);

  const handleFormSubmit = () => {
    setShowForm(false);
    loadExpenses();
  };

  // İstatistikleri hesapla
  const activeExpenses = expenses.filter(expense => expense.isActive);
  const totalMonthlyExpense = activeExpenses
    .filter(expense => expense.isInstallment)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const unpaidExpenses = activeExpenses.filter(expense => !expense.isPaid);
  const unpaidAmount = unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const installmentExpenseCount = activeExpenses.filter(expense => expense.isInstallment).length;

  // Kategori analizi için veri hazırla
  const categoryData = activeExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Diğer';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, count: 0 };
    }
    acc[category].value += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number; count: number }>);

  const categoryChartData = Object.values(categoryData).sort((a, b) => b.value - a.value);
  
  // Grafik renkleri
  const CHART_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];
  
  // Aylık trend verisi (son 6 ay)
  const monthlyTrendData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const monthName = monthNames[date.getMonth()];
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
    });
    const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    monthlyTrendData.push({ month: monthName, amount: totalAmount });
  }

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Giderler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const totalExpenseAmount = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page-container bg-background">
      {/* Summary Header */}
      <div className="bank-gradient-red px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider font-medium">
                {monthNames[currentMonth - 1]} {currentYear}
              </p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(totalExpenseAmount)}
              </p>
              <p className="text-white/50 text-xs mt-1">Toplam Gider</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors active:scale-95"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-sm min-w-[140px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <CreditCard className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{expenses.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Kayıt</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Calendar className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{formatCurrency(totalMonthlyExpense)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Taksit</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <AlertTriangle className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{formatCurrency(unpaidAmount)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Ödenmemiş</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Unpaid Warning */}
        {unpaidExpenses.length > 0 && (
          <div className="bank-card p-4 mb-4 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{unpaidExpenses.length} ödenmemiş gider</p>
                <p className="text-xs text-muted-foreground">Toplam: {formatCurrency(unpaidAmount)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {categoryChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Kategori Dağılımı</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={categoryChartData} cx="50%" cy="50%" labelLine={false} outerRadius={70} fill="#8884d8" dataKey="value">
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {categoryChartData.slice(0, 4).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{category.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Aylık Trend</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" fill="hsl(0 72% 51%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="bank-card overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Gider Listesi</h2>
            <span className="text-xs text-muted-foreground">{expenses.length} kayıt</span>
          </div>
          <div className="p-4">
            <ExpenseTable expenses={expenses} onUpdate={loadExpenses} />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bank-gradient-red flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Yeni Gider Ekle</h3>
            </div>
            <ExpenseForm onSubmit={async (data) => {
              try {
                await addExpense(user!.id, data, user?.primaryEmailAddress?.emailAddress, user?.fullName || undefined);
                handleFormSubmit();
              } catch (error) {
                console.error('Error adding expense:', error);
                alert('Taksit eklenirken bir hata oluştu.');
              }
            }} />
            <button
              onClick={() => setShowForm(false)}
              className="mt-4 w-full btn-outline text-foreground"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};