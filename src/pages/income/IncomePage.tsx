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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6" style={{ color: '#ffb700' }} />
              <h1 className="text-xl font-semibold text-gray-900">Gelirlerim</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        {/* Month Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 p-1 lg:p-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
              </button>
              <div className="px-4 lg:px-6 py-2 text-center min-w-[160px] lg:min-w-[200px]">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                  {monthNames[currentMonth - 1]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{incomes.length}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Düzenli Gelirler</p>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">{recurringIncomeCount}</p>
              </div>
              <div className="p-2 lg:p-3 bg-blue-100 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <Calendar className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Aylık Gelir</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Tek Seferlik</p>
                <p className="text-lg lg:text-2xl font-bold text-yellow-600">{formatCurrency(totalOneTimeIncome)}</p>
              </div>
              <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gelirler Tablosu */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Gelir Listesi</h2>
          </div>
          <div className="p-3 lg:p-6">
            <IncomeTable incomes={incomes} onUpdate={loadIncomes} />
          </div>
        </div>



        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 lg:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-base lg:text-lg font-medium mb-4 text-gray-900">Yeni Gelir Ekle</h3>
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
                className="mt-4 w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 transition-colors"
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