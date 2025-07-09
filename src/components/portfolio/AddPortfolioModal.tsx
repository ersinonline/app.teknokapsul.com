import React, { useState } from 'react';
import { X, Plus, TrendingUp } from 'lucide-react';
import { PortfolioItem, PORTFOLIO_CATEGORIES, GOLD_TYPES } from '../../types/portfolio';

interface AddPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<PortfolioItem, 'id' | 'currentPrice' | 'totalValue' | 'totalReturn' | 'returnPercentage' | 'lastUpdated'>) => void;
}

export const AddPortfolioModal: React.FC<AddPortfolioModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    type: 'stock' as keyof typeof PORTFOLIO_CATEGORIES,
    name: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Yatırım adı gereklidir';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Sembol gereklidir';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Geçerli bir miktar giriniz';
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Geçerli bir alış fiyatı giriniz';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Alış tarihi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const portfolioItem = {
      type: formData.type,
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: formData.purchaseDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '' // Bu değer PortfolioService tarafından doldurulacak
    };

    onAdd(portfolioItem);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'stock',
      name: '',
      symbol: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    onClose();
  };

  const getSymbolOptions = () => {
    switch (formData.type) {
      case 'gold':
        return Object.entries(GOLD_TYPES).map(([key, value]) => ({ key, value }));
      case 'usd':
        return [{ key: 'USD', value: 'ABD Doları' }];
      case 'eur':
        return [{ key: 'EUR', value: 'Euro' }];

      default:
        return [];
    }
  };

  const handleTypeChange = (type: keyof typeof PORTFOLIO_CATEGORIES) => {
    setFormData(prev => ({
      ...prev,
      type,
      symbol: '',
      name: ''
    }));
    setErrors({});
  };

  const handleSymbolChange = (symbol: string) => {
    let name = '';
    
    if (formData.type === 'gold' && GOLD_TYPES[symbol as keyof typeof GOLD_TYPES]) {
      name = GOLD_TYPES[symbol as keyof typeof GOLD_TYPES];
    } else if (['usd', 'eur'].includes(formData.type)) {
      name = PORTFOLIO_CATEGORIES[formData.type as keyof typeof PORTFOLIO_CATEGORIES];
    }

    setFormData(prev => ({
      ...prev,
      symbol,
      name: name || prev.name
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Yeni Yatırım Ekle</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Yatırım Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Yatırım Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PORTFOLIO_CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key as keyof typeof PORTFOLIO_CATEGORIES)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.type === key
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Sembol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sembol
            </label>
            {getSymbolOptions().length > 0 ? (
              <select
                value={formData.symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seçiniz...</option>
                {getSymbolOptions().map(({ key, value }) => (
                  <option key={key} value={key}>
                    {key} - {value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="Örn: AAPL, THYAO, BTC"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            {errors.symbol && (
              <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
            )}
          </div>

          {/* Yatırım Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatırım Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Örn: Apple Inc., Türk Hava Yolları"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Miktar ve Alış Fiyatı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miktar
              </label>
              <input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alış Fiyatı (₺)
              </label>
              <input
                type="number"
                step="any"
                value={formData.purchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                placeholder="0.00"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.purchasePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
              )}
            </div>
          </div>

          {/* Alış Tarihi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alış Tarihi
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                errors.purchaseDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.purchaseDate && (
              <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};