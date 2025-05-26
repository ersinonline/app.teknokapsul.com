```tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addHome, uploadHomeDocument } from '../../services/home.service';
import { HomeFormData } from '../../types/home';

interface HomeFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const HomeForm: React.FC<HomeFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<HomeFormData>({
    address: '',
    type: 'rental',
    rentAmount: 0,
    rentDueDay: 1,
    contractStartDate: '',
    contractEndDate: '',
    notes: ''
  });

  const [documents, setDocuments] = useState<{
    contract?: File;
    bills?: File[];
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Add home first
      const homeId = await addHome(user.uid, formData);

      // Upload contract if provided
      if (documents.contract) {
        await uploadHomeDocument(homeId, 'contract', documents.contract);
      }

      // Upload bills if provided
      if (documents.bills) {
        await Promise.all(
          documents.bills.map(bill => uploadHomeDocument(homeId, 'bills', bill))
        );
      }

      onSave();
      onClose();
    } catch (err) {
      setError('Ev eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Ev Ekle</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ev Tipi
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'rental' | 'owned' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="rental">Kiralık</option>
              <option value="owned">Mülk</option>
            </select>
          </div>

          {formData.type === 'rental' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kira Tutarı
                  </label>
                  <input
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Günü
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.rentDueDay}
                    onChange={(e) => setFormData({ ...formData, rentDueDay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontrat Başlangıç
                  </label>
                  <input
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontrat Bitiş
                  </label>
                  <input
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kira Sözleşmesi
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setDocuments({ ...documents, contract: e.target.files?.[0] })}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Faturalar
            </label>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => setDocuments({ ...documents, bills: Array.from(e.target.files || []) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```