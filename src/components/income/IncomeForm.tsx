import { useState } from 'react';
import { Income, IncomeFormData, INCOME_CATEGORIES } from '../../types/income';
import { formatNumberWithThousandsSeparator, parseFormattedNumber } from '../../utils/numberFormat';

interface IncomeFormProps {
  onSubmit: (data: IncomeFormData) => Promise<void>;
  initialData?: Income;
  isLoading?: boolean;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ onSubmit, initialData, isLoading = false }) => {
  const [formData, setFormData] = useState<IncomeFormData>({
    title: initialData?.title || '',
    amount: initialData?.amount || 0,
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    category: initialData?.category || 'salary',

    isRecurring: initialData?.isRecurring || false,
    recurringDay: initialData?.recurringDay || 1,
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof IncomeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gelir Adı *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Örn: Maaş, Freelance Proje"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tutar (TL) *
        </label>
        <input
          type="text"
          value={formData.amount ? formatNumberWithThousandsSeparator(formData.amount) : ''}
          onChange={(e) => {
            const numericValue = parseFormattedNumber(e.target.value);
            handleChange('amount', numericValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          {Object.entries(INCOME_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={formData.isRecurring}
          onChange={(e) => handleChange('isRecurring', e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="isRecurring" className="text-sm text-gray-700">
          Düzenli gelir (aylık)
        </label>
      </div>

      {formData.isRecurring ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ayın Kaçında Alınacak
            </label>
            <input
              type="number"
              value={formData.recurringDay}
              onChange={(e) => handleChange('recurringDay', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min="1"
              max="31"
              required
            />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarih
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}



      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Ekle')}
      </button>
    </form>
  );
};