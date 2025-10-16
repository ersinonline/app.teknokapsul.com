import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addPersonalDebt } from '../../services/debt.service';
import { PersonalDebtFormData } from '../../types/debt';

interface PersonalDebtFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const PersonalDebtForm: React.FC<PersonalDebtFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalDebtFormData>({
    description: '',
    amount: 0,
    dueDate: '',
    creditor: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Get user email and name from Clerk user object
      const userEmail = user.emailAddresses?.[0]?.emailAddress;
      const userName = user.fullName || user.firstName || 'Kullanıcı';
      
      await addPersonalDebt(user.id, formData, userEmail, userName);
      onSave();
      onClose();
    } catch (err) {
      setError('Borç kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Kişisel Borç</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="creditor" className="block text-sm font-medium text-gray-700 mb-1">
              Alacaklı
            </label>
            <input
              type="text"
              id="creditor"
              value={formData.creditor}
              onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Son Ödeme Tarihi
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notlar (İsteğe bağlı)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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