import { useState } from 'react';
import { Edit2, Trash2, Power, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react';
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
      await deleteExpense(user.uid, id);
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
      await toggleExpenseStatus(user.uid, id, !currentStatus);
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
      await toggleExpensePayment(user.uid, id, !currentPaymentStatus);
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
      className: 'bg-purple-100 text-purple-800'
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
    <div className="overflow-x-auto">
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Gideri Düzenle</h3>
            <ExpenseForm
              onSubmit={async (data) => {
                try {
                  await updateExpense(user.uid, editingExpense.id, data);
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

      <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gider
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Kategori
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tarih
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ödeme
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedExpenses.map((expense) => {
            const statusInfo = getStatusInfo(expense);
            const paymentInfo = getPaymentInfo(expense);

            return (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                  <div className="text-sm text-red-600 font-semibold">{formatCurrency(expense.amount)}</div>
                  {expense.description && (
                    <div className="text-xs text-gray-500 mt-1">{expense.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {EXPENSE_CATEGORIES[expense.category]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleTogglePayment(expense.id, expense.isPaid)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${paymentInfo.className} hover:opacity-80 disabled:opacity-50`}
                    disabled={isTogglingPayment === expense.id}
                  >
                    {paymentInfo.icon}
                    {paymentInfo.text}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="text-yellow-600 hover:text-yellow-900 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(expense.id, expense.isActive)}
                      className={`${expense.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} disabled:opacity-50 transition-colors`}
                      title={expense.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      disabled={isToggling === expense.id}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                      disabled={isDeleting === expense.id}
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};