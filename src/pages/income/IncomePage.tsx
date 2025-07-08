import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
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
      const userIncomes = await getUserIncomes(user.uid, currentYear, currentMonth);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-500" />
                Gelirlerim
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                Düzenli ve tek seferlik gelirlerinizi yönetin
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl text-sm lg:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="sm:inline">Yeni Gelir Ekle</span>
            </button>
          </div>
          
          {/* Ay Navigasyonu */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 lg:p-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="px-4 lg:px-6 py-2 text-center min-w-[160px] lg:min-w-[200px]">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">
                  {monthNames[currentMonth - 1]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{incomes.length}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Düzenli Gelirler</p>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">{recurringIncomeCount}</p>
              </div>
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <Calendar className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Aylık Gelir</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Tek Seferlik</p>
                <p className="text-lg lg:text-2xl font-bold text-purple-600">{formatCurrency(totalOneTimeIncome)}</p>
              </div>
              <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gelirler Tablosu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Gelir Listesi</h2>
          </div>
          <div className="p-3 lg:p-6">
            <IncomeTable incomes={incomes} onUpdate={loadIncomes} />
          </div>
        </div>



        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-base lg:text-lg font-medium mb-4 text-gray-900 dark:text-white">Yeni Gelir Ekle</h3>
              <IncomeForm onSubmit={async (data) => {
                try {
                  await addIncome(user!.uid, data);
                  handleFormSubmit();
                } catch (error) {
                  console.error('Error adding income:', error);
                  alert('Gelir eklenirken bir hata oluştu.');
                }
              }} />
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 w-full rounded-lg bg-gray-200 dark:bg-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
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