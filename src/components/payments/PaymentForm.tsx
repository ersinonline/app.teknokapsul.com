import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface PaymentFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSharedExpense, setIsSharedExpense] = useState(false);
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    bank: '',
    date: '',
    description: '',
    installments: '',
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const selectedDate = new Date(formData.date);
      const payment = {
        ...formData,
        amount: `${parseFloat(formData.amount).toFixed(2)} TL`,
        userId: user.uid,
        status: 'Ödenmedi',
        date: selectedDate.toISOString(),
        isSharedExpense,
        ...(isSharedExpense && { sharedWithEmail }),
      };

      await addDoc(collection(db, 'payments'), payment);
      onSave();
      onClose();
    } catch (err) {
      setError('Borç kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Yeni Borç Ekle</h2>
          <button onClick={onClose} className="btn p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Açıklama
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Tutar (TL)
            </label>
            <input
              type="number"
              id="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Tarih
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="bank" className="block text-sm font-medium mb-1">
              Banka
            </label>
            <input
              type="text"
              id="bank"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Kategori
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Kategori Seçin</option>
              <option value="market">Market</option>
              <option value="akaryakit">Akaryakıt</option>
              <option value="giyim">Giyim</option>
              <option value="yemek">Yemek</option>
              <option value="ev">Ev</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSharedExpense}
                onChange={(e) => setIsSharedExpense(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm font-medium">Ortak Harcama</span>
            </label>
          </div>

          {isSharedExpense && (
            <div>
              <label htmlFor="sharedWithEmail" className="block text-sm font-medium mb-1">
                Ortak Harcama Yapılan Kişinin E-postası
              </label>
              <input
                type="email"
                id="sharedWithEmail"
                value={sharedWithEmail}
                onChange={(e) => setSharedWithEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
                required={isSharedExpense}
              />
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};