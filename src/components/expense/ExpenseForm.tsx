import { useState } from 'react';
import { ExpenseFormData, EXPENSE_CATEGORIES } from '../../types/expense';
import { useAuth } from '../../contexts/AuthContext';

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void | Promise<void>;
  initialData?: Partial<ExpenseFormData>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, initialData }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: initialData?.title || '',
    amount: initialData?.amount || 0,
    category: initialData?.category || 'other',

    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isRecurring: initialData?.isRecurring || false,
    recurringDay: initialData?.recurringDay || 1,
    recurringMonths: initialData?.recurringMonths || 12,
    isPaid: initialData?.isPaid || false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Gider kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gider Adı *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
          placeholder="Örn: Market alışverişi"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tutar (₺) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof EXPENSE_CATEGORIES })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
          required
        >
          {Object.entries(EXPENSE_CATEGORIES).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>



      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tarih *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={formData.isRecurring}
          onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
          Düzenli gider (her ay tekrarlanır)
        </label>
      </div>

      {formData.isRecurring && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ayın kaçında ödenecek? *
            </label>
            <select
              value={formData.recurringDay}
              onChange={(e) => setFormData({ ...formData, recurringDay: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
              required
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}. gün</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kaç ay devam edecek? *
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={formData.recurringMonths}
              onChange={(e) => setFormData({ ...formData, recurringMonths: parseInt(e.target.value) || 1 })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:ring-red-500"
              placeholder="12"
              required
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPaid"
          checked={formData.isPaid}
          onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
          Ödendi
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Aktif
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Gider Ekle')}
      </button>
    </form>
  );
};