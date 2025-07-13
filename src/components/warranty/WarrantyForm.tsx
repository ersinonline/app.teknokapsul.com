import React, { useState } from 'react';
import { X, Package, DollarSign, FileText } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface WarrantyFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const WarrantyForm: React.FC<WarrantyFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyPeriod: 12,
    category: '',
    purchasePrice: '',
    store: '',
    notes: ''
  });

  const categories = [
    'Elektronik',
    'Ev Aletleri',
    'Bilgisayar & Teknoloji',
    'Telefon & Tablet',
    'Otomotiv',
    'Mobilya',
    'Giyim & Aksesuar',
    'Spor & Outdoor',
    'Diğer'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const purchaseDate = new Date(formData.purchaseDate);
      const warrantyEndDate = new Date(purchaseDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + formData.warrantyPeriod);

      await addDoc(collection(db, 'teknokapsul', user.uid, 'warranties'), {
        ...formData,
        purchaseDate,
        warrantyEndDate,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        userId: user.uid,
        createdAt: new Date()
      });

      onSave();
    } catch (error) {
      console.error('Error adding warranty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Yeni Garanti Ekle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: '#ffb700' }} />
              Ürün Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Ürün adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Marka adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Model bilgisini girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seri Numarası
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Seri numarasını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Kategori seçin</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: '#ffb700' }} />
              Satın Alma Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satın Alma Tarihi *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garanti Süresi (Ay) *
                </label>
                <input
                  type="number"
                  name="warrantyPeriod"
                  value={formData.warrantyPeriod}
                  onChange={handleChange}
                  required
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satın Alma Fiyatı (₺)
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satın Alınan Mağaza
              </label>
              <input
                type="text"
                name="store"
                value={formData.store}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder="Mağaza adını girin"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#ffb700' }} />
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="Ek notlar ekleyebilirsiniz..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e6a500')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ffb700')}
            >
              {loading ? 'Kaydediliyor...' : 'Garanti Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};