import { useState } from 'react';
import { Edit2, Trash2, Power, Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Expense, EXPENSE_CATEGORIES } from '../../types/expense';
import { updateExpense, deleteExpense, toggleExpenseStatus, toggleExpensePayment } from '../../services/expense.service';
import { ExpenseForm } from './ExpenseForm';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';

interface ExpenseTableProps {
  expenses: Expense[];
  onUpdate: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, onUpdate }) => {
  const { user } = useAuth();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isTogglingPayment, setIsTogglingPayment] = useState<string | null>(null);

  if (!user) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;
    
    setIsDeleting(id);
    try {
      await deleteExpense(user.id, id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Gider silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsToggling(id);
    try {
      await toggleExpenseStatus(user.id, id, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error('Error toggling expense status:', error);
      alert('Gider durumu güncellenirken bir hata oluştu.');
    } finally {
      setIsToggling(null);
    }
  };

  const handleTogglePayment = async (id: string, currentPaymentStatus: boolean) => {
    setIsTogglingPayment(id);
    try {
      await toggleExpensePayment(user.id, id, !currentPaymentStatus);
      onUpdate();
    } catch (error) {
      console.error('Error toggling expense payment:', error);
      alert('Ödeme durumu güncellenirken bir hata oluştu.');
    } finally {
      setIsTogglingPayment(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Henüz gider eklenmedi</p>
        <p className="text-sm">İlk giderinizi ekleyerek başlayın</p>
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getStatusInfo = (expense: Expense) => {
    if (!expense.isActive) {
      return {
        icon: <Power className="w-4 h-4" />,
        text: 'Pasif',
        className: 'bg-gray-100 text-gray-800'
      };
    }
    if (expense.isRecurring) {
      return {
        icon: <Calendar className="w-4 h-4" />,
        text: `Düzenli (${expense.recurringDay}. gün)`,
        className: 'bg-blue-100 text-blue-800'
      };
    }
    return {
      icon: <CreditCard className="w-4 h-4" />,
      text: 'Tek seferlik',
      className: 'bg-yellow-100 text-yellow-800'
    };
  };

  const getPaymentInfo = (expense: Expense) => {
    if (expense.isPaid) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Ödendi',
        className: 'bg-green-100 text-green-800'
      };
    }
    return {
      icon: <XCircle className="w-4 h-4" />,
      text: 'Ödenmedi',
      className: 'bg-red-100 text-red-800'
    };
  };

  return (
    <div>
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Gideri Düzenle</h3>
            <ExpenseForm
              onSubmit={async (data) => {
                try {
                  await updateExpense(user.id, editingExpense.id, data);
                  setEditingExpense(null);
                  onUpdate();
                } catch (error) {
                  console.error('Error updating expense:', error);
                  alert('Gider güncellenirken bir hata oluştu.');
                }
              }}
              initialData={editingExpense}
            />
            <button
              onClick={() => setEditingExpense(null)}
              className="mt-4 w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Modern Card View - Tüm Ekranlar İçin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedExpenses.map((expense) => {
          const statusInfo = getStatusInfo(expense);
          const paymentInfo = getPaymentInfo(expense);

          return (
            <div key={expense.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{expense.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                    {expense.isRecurring && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        Düzenli
                      </span>
                    )}
                  </div>
                  {expense.description && (
                    <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Kategori</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {EXPENSE_CATEGORIES[expense.category]}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Tarih</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(expense.date)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Durum</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Ödeme</div>
                  <button
                    onClick={() => handleTogglePayment(expense.id, expense.isPaid)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${paymentInfo.className} hover:opacity-80 disabled:opacity-50`}
                    disabled={isTogglingPayment === expense.id}
                  >
                    {paymentInfo.icon}
                    {paymentInfo.text}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    disabled={isDeleting === expense.id}
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
                <button
                  onClick={() => handleToggleStatus(expense.id, expense.isActive)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    expense.isActive 
                      ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                  disabled={isToggling === expense.id}
                >
                  <Power className="w-4 h-4" />
                  {expense.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};