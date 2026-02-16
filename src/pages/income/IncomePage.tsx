import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Calendar, ChevronLeft, ChevronRight, Wallet, ArrowUpCircle } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
        <p className="text-green-700 font-medium">Gelirler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 min-h-screen">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gelirlerim</h1>
                <p className="text-xs text-gray-500">Gelir takibi ve yönetimi</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Yeni</span> Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-6">
        {/* Month Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-white rounded-2xl shadow-xl border-2 border-green-100 p-2 lg:p-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </button>
              <div className="px-6 lg:px-8 py-2 text-center min-w-[180px] lg:min-w-[220px]">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">
                  {monthNames[currentMonth - 1]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </button>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
          <div className="bg-white rounded-2xl p-4 lg:p-7 shadow-xl border-2 border-green-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-1">Toplam Gelir</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">{incomes.length}</p>
              </div>
              <div className="p-3 lg:p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl self-end lg:self-auto mt-2 lg:mt-0 shadow-md">
                <TrendingUp className="w-5 h-5 lg:w-7 lg:h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-7 shadow-xl border-2 border-blue-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-1">Düzenli Gelirler</p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-600">{recurringIncomeCount}</p>
              </div>
              <div className="p-3 lg:p-4 bg-gradient-to-br from-blue-100 to-sky-100 rounded-2xl self-end lg:self-auto mt-2 lg:mt-0 shadow-md">
                <Calendar className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 lg:p-7 shadow-xl border-2 border-green-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-white/90 mb-1">Aylık Gelir</p>
                <p className="text-xl lg:text-3xl font-bold text-white">{formatCurrency(totalMonthlyIncome)}</p>
              </div>
              <div className="p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-2xl self-end lg:self-auto mt-2 lg:mt-0 shadow-lg">
                <Wallet className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 lg:p-7 shadow-xl border-2 border-yellow-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-white/90 mb-1">Tek Seferlik</p>
                <p className="text-xl lg:text-3xl font-bold text-white">{formatCurrency(totalOneTimeIncome)}</p>
              </div>
              <div className="p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-2xl self-end lg:self-auto mt-2 lg:mt-0 shadow-lg">
                <ArrowUpCircle className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Gelirler Tablosu */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-100">
          <div className="px-5 lg:px-7 py-4 lg:py-5 border-b-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Gelir Listesi</h2>
            </div>
          </div>
          <div className="p-4 lg:p-7">
            <IncomeTable incomes={incomes} onUpdate={loadIncomes} />
          </div>
        </div>



        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 lg:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Yeni Gelir Ekle</h3>
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
                className="mt-6 w-full rounded-xl bg-gray-200 px-5 py-3 text-gray-800 hover:bg-gray-300 transition-all duration-200 font-semibold hover:scale-105 active:scale-95"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};