import { useState } from 'react';
import { Edit2, Trash2, Power, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
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
      await deleteIncome(user.id, id);
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
      await toggleIncomeStatus(user.id, id, !currentStatus);
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
    <div>
      {editingIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Geliri Düzenle</h3>
            <IncomeForm
              onSubmit={async (data) => {
                try {
                  await updateIncome(user.id, editingIncome.id, data);
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

      {/* Modern Card View - Tüm Ekranlar İçin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedIncomes.map((income) => {
          const { icon, text, className } = getStatusInfo(income);

          return (
            <div key={income.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{income.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(income.amount)}</span>
                    {income.isRecurring && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        Düzenli
                      </span>
                    )}
                  </div>
                  {income.description && (
                    <p className="text-sm text-gray-600 mt-2">{income.description}</p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Kategori</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {INCOME_CATEGORIES[income.category]}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Tarih</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(income.date)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <div className="text-xs font-medium text-gray-500 mb-1">Durum</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
                    {icon}
                    {text}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingIncome(income)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    disabled={isDeleting === income.id}
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
                <button
                  onClick={() => handleToggleStatus(income.id, income.isActive)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    income.isActive 
                      ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                  disabled={isToggling === income.id}
                >
                  <Power className="w-4 h-4" />
                  {income.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};