import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DEFAULT_CATEGORIES, CategoryType } from '../../types/budget';

interface PaymentFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    description: '',
    category: '' as CategoryType,
    type: 'regular' as 'regular' | 'installment',
    installmentCount: '1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const amount = parseFloat(formData.amount);
      const installmentCount = parseInt(formData.installmentCount);
      
      if (formData.type === 'installment' && installmentCount > 1) {
        // Create multiple payments for installments
        const installmentAmount = amount / installmentCount;
        const baseDate = new Date(formData.date);
        
        for (let i = 0; i < installmentCount; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + i);
          
          await addDoc(collection(db, 'payments'), {
            userId: user.uid,
            title: formData.title,
            description: formData.description,
            amount: installmentAmount,
            date: installmentDate.toISOString(),
            category: formData.category || undefined,
            status: 'Ödenmedi',
            type: 'installment',
            installment: {
              current: i + 1,
              total: installmentCount
            },
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Create single payment
        await addDoc(collection(db, 'payments'), {
          userId: user.uid,
          title: formData.title,
          description: formData.description,
          amount: amount,
          date: formData.date,
          category: formData.category || undefined,
          status: 'Ödenmedi',
          type: 'regular',
          createdAt: new Date().toISOString()
        });
      }

      onSave();
      onClose();
    } catch (err) {
      setError('Borç kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Borç Ekle</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Başlık
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Tutar (TL)
            </label>
            <input
              type="number"
              id="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryType })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Kategori Seçin</option>
              {Object.entries(DEFAULT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Türü
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'regular' | 'installment' })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="regular">Tek Seferlik</option>
              <option value="installment">Taksitli</option>
            </select>
          </div>

          {formData.type === 'installment' && (
            <div>
              <label htmlFor="installmentCount" className="block text-sm font-medium text-gray-700 mb-1">
                Taksit Sayısı
              </label>
              <input
                type="number"
                id="installmentCount"
                min="2"
                max="36"
                value={formData.installmentCount}
                onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama (İsteğe bağlı)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};