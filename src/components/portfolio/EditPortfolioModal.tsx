import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { PortfolioItem, PORTFOLIO_CATEGORIES, GOLD_TYPES, CURRENCY_TYPES } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';

interface EditPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  item: PortfolioItem;
}

export const EditPortfolioModal: React.FC<EditPortfolioModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  item
}) => {
  const [formData, setFormData] = useState({
    name: item.name,
    symbol: item.symbol,
    type: item.type,
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    purchaseDate: item.purchaseDate
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: item.name,
        symbol: item.symbol,
        type: item.type,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        purchaseDate: item.purchaseDate
      });
      setErrors({});
    }
  }, [isOpen, item]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Yatırım adı gereklidir';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Sembol gereklidir';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Miktar 0\'dan büyük olmalıdır';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Alış fiyatı 0\'dan büyük olmalıdır';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Alış tarihi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdate(item.id, {
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        quantity: formData.quantity,
        purchasePrice: formData.purchasePrice,
        purchaseDate: formData.purchaseDate
      });
      onClose();
    } catch (error) {
      console.error('Error updating portfolio item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSymbolOptions = () => {
    if (formData.type === 'gold') {
      return Object.entries(GOLD_TYPES).map(([key, value]) => ({ key, value }));
    } else if (['usd', 'eur'].includes(formData.type)) {
      return Object.entries(CURRENCY_TYPES).map(([key, value]) => ({ key, value }));
    }
    return [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Yatırımı Düzenle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Yatırım Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatırım Türü
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as keyof typeof PORTFOLIO_CATEGORIES;
                setFormData({ ...formData, type: newType, symbol: '', name: '' });
                setErrors({ ...errors, type: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              {Object.entries(PORTFOLIO_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Sembol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sembol
            </label>
            {(formData.type === 'gold' || ['usd', 'eur'].includes(formData.type)) ? (
              <select
                value={formData.symbol}
                onChange={(e) => {
                  const selectedOption = getSymbolOptions().find(opt => opt.key === e.target.value);
                  setFormData({ 
                    ...formData, 
                    symbol: e.target.value,
                    name: selectedOption?.value || ''
                  });
                  setErrors({ ...errors, symbol: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Seçiniz...</option>
                {getSymbolOptions().map(({ key, value }) => (
                  <option key={key} value={key}>{value} ({key})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => {
                  setFormData({ ...formData, symbol: e.target.value.toUpperCase() });
                  setErrors({ ...errors, symbol: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Örn: AAPL, BIST30"
                required
              />
            )}
            {errors.symbol && <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>}
          </div>

          {/* Yatırım Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatırım Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Yatırım adını girin"
              required
              readOnly={formData.type === 'gold' || ['usd', 'eur'].includes(formData.type)}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Miktar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miktar
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 });
                setErrors({ ...errors, quantity: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0"
              min="0"
              step="any"
              required
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>

          {/* Alış Fiyatı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alış Fiyatı (TL)
            </label>
            <input
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => {
                setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 });
                setErrors({ ...errors, purchasePrice: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>}
          </div>

          {/* Alış Tarihi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alış Tarihi
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => {
                setFormData({ ...formData, purchaseDate: e.target.value });
                setErrors({ ...errors, purchaseDate: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.purchaseDate && <p className="text-red-500 text-sm mt-1">{errors.purchaseDate}</p>}
          </div>

          {/* Özet Bilgiler */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900">Mevcut Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Güncel Fiyat:</span>
                <p className="font-medium">{formatCurrency(item.currentPrice)}</p>
              </div>
              <div>
                <span className="text-gray-600">Toplam Değer:</span>
                <p className="font-medium">{formatCurrency(item.totalValue)}</p>
              </div>
              <div>
                <span className="text-gray-600">Getiri:</span>
                <p className={`font-medium ${
                  item.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  %{item.returnPercentage.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Son Güncelleme:</span>
                <p className="font-medium">
                  {item.lastUpdated.toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Güncelle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};