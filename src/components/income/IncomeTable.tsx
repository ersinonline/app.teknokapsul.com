import { useState } from 'react';
import { Edit2, Trash2, Power, Calendar, TrendingUp } from 'lucide-react';
import { Income, INCOME_CATEGORIES } from '../../types/income';
import { updateIncome, deleteIncome, toggleIncomeStatus } from '../../services/income.service';
import { IncomeForm } from './IncomeForm';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';

interface IncomeTableProps {
  incomes: Income[];
  onUpdate: () => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({ incomes, onUpdate }) => {
  const { user } = useAuth();
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  if (!user) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('Bu geliri silmek istediğinizden emin misiniz?')) return;
    
    setIsDeleting(id);
    try {
      await deleteIncome(user.uid, id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Gelir silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsToggling(id);
    try {
      await toggleIncomeStatus(user.uid, id, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error('Error toggling income status:', error);
      alert('Gelir durumu güncellenirken bir hata oluştu.');
    } finally {
      setIsToggling(null);
    }
  };

  if (incomes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Henüz gelir eklenmedi</p>
        <p className="text-sm">İlk gelirinizi ekleyerek başlayın</p>
      </div>
    );
  }

  const sortedIncomes = [...incomes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getStatusInfo = (income: Income) => {
    if (!income.isActive) {
      return {
        icon: <Power className="w-4 h-4" />,
        text: 'Pasif',
        className: 'bg-gray-100 text-gray-800'
      };
    }
    if (income.isRecurring) {
      return {
        icon: <Calendar className="w-4 h-4" />,
        text: `Düzenli (${income.recurringDay}. gün)`,
        className: 'bg-blue-100 text-blue-800'
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4" />,
      text: 'Tek seferlik',
      className: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="overflow-x-auto">
      {editingIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Geliri Düzenle</h3>
            <IncomeForm
              onSubmit={async (data) => {
                try {
                  await updateIncome(user.uid, editingIncome.id, data);
                  setEditingIncome(null);
                  onUpdate();
                } catch (error) {
                  console.error('Error updating income:', error);
                  alert('Gelir güncellenirken bir hata oluştu.');
                }
              }}
              initialData={editingIncome}
            />
            <button
              onClick={() => setEditingIncome(null)}
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
              Gelir
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
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedIncomes.map((income) => {
            const { icon, text, className } = getStatusInfo(income);

            return (
              <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{income.title}</div>
                  <div className="text-sm text-green-600 font-semibold">{formatCurrency(income.amount)}</div>
                  {income.description && (
                    <div className="text-xs text-gray-500 mt-1">{income.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {INCOME_CATEGORIES[income.category]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(income.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
                    {icon}
                    {text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingIncome(income)}
                      className="text-yellow-600 hover:text-yellow-900 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(income.id, income.isActive)}
                      className={`${income.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} disabled:opacity-50 transition-colors`}
                      title={income.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      disabled={isToggling === income.id}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                      disabled={isDeleting === income.id}
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