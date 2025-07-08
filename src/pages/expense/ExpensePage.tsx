import { useState, useEffect } from 'react';
import { Plus, CreditCard, Calendar, DollarSign, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
      const userExpenses = await getUserExpenses(user.uid, currentYear, currentMonth);
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
    .filter(expense => expense.isRecurring)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const unpaidExpenses = activeExpenses.filter(expense => !expense.isPaid);
  const unpaidAmount = unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const recurringExpenseCount = activeExpenses.filter(expense => expense.isRecurring).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
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
                <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
                Giderlerim
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                Düzenli ve tek seferlik giderlerinizi yönetin
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl text-sm lg:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="sm:inline">Yeni Gider Ekle</span>
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
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
                <p className="text-lg lg:text-2xl font-bold text-red-600">{expenses.length}</p>
              </div>
              <div className="p-2 lg:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <CreditCard className="w-4 h-4 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Düzenli Giderler</p>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">{recurringExpenseCount}</p>
              </div>
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <Calendar className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Aylık Gider</p>
                <p className="text-lg lg:text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpense)}</p>
              </div>
              <div className="p-2 lg:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 lg:col-span-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Ödenmemiş</p>
                <p className="text-lg lg:text-2xl font-bold text-orange-600">{formatCurrency(unpaidAmount)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{unpaidExpenses.length} adet</p>
              </div>
              <div className="p-2 lg:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg self-end lg:self-auto mt-2 lg:mt-0">
                <AlertTriangle className="w-4 h-4 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Uyarı - Ödenmemiş Giderler */}
        {unpaidExpenses.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Ödenmemiş Giderler
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {unpaidExpenses.length} adet gideriniz ödenmemiş durumda. Toplam tutar: {formatCurrency(unpaidAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Giderler Tablosu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Gider Listesi</h2>
          </div>
          <div className="p-3 lg:p-6">
            <ExpenseTable expenses={expenses} onUpdate={loadExpenses} />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-base lg:text-lg font-medium mb-4 text-gray-900 dark:text-white">Yeni Gider Ekle</h3>
              <ExpenseForm onSubmit={async (data) => {
                try {
                  await addExpense(user!.uid, data);
                  handleFormSubmit();
                } catch (error) {
                  console.error('Error adding expense:', error);
                  alert('Gider eklenirken bir hata oluştu.');
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