import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Calendar, ChevronLeft, ChevronRight, ArrowUpCircle } from 'lucide-react';
import { Income } from '../../types/income';
import { getUserIncomes, addIncome } from '../../services/income.service';
import { IncomeForm } from '../../components/income/IncomeForm';
import { IncomeTable } from '../../components/income/IncomeTable';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';

export const IncomePage: React.FC = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const loadIncomes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userIncomes = await getUserIncomes(user.id, currentYear, currentMonth);
      setIncomes(userIncomes);
    } catch (error) {
      console.error('Error loading incomes:', error);
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
    loadIncomes();
  }, [user, currentYear, currentMonth]);

  const handleFormSubmit = () => {
    setShowForm(false);
    loadIncomes();
  };



  // İstatistikleri hesapla
  const activeIncomes = incomes.filter(income => income.isActive);
  const totalMonthlyIncome = activeIncomes
    .filter(income => income.isRecurring)
    .reduce((sum, income) => sum + income.amount, 0);
  const totalOneTimeIncome = activeIncomes
    .filter(income => !income.isRecurring)
    .reduce((sum, income) => sum + income.amount, 0);
  const recurringIncomeCount = activeIncomes.filter(income => income.isRecurring).length;

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Gelirler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Summary Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider font-medium">
                {monthNames[currentMonth - 1]} {currentYear}
              </p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(totalMonthlyIncome + totalOneTimeIncome)}
              </p>
              <p className="text-white/50 text-xs mt-1">Toplam Gelir</p>
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
              <TrendingUp className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{incomes.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Kayıt</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Calendar className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{formatCurrency(totalMonthlyIncome)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Düzenli</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <ArrowUpCircle className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{formatCurrency(totalOneTimeIncome)}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Tek Seferlik</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income List */}
      <div className="page-content -mt-5">
        <div className="bank-card overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Gelir Listesi</h2>
            <span className="text-xs text-muted-foreground">{incomes.length} kayıt</span>
          </div>
          <div className="p-4">
            <IncomeTable incomes={incomes} onUpdate={loadIncomes} />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bank-gradient-green flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Yeni Gelir Ekle</h3>
            </div>
            <IncomeForm onSubmit={async (data) => {
              try {
                await addIncome(user!.id, data);
                handleFormSubmit();
              } catch (error) {
                console.error('Error adding income:', error);
                alert('Gelir eklenirken bir hata oluştu.');
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