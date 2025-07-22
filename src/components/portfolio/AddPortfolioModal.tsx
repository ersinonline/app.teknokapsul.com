import React, { useState } from 'react';
import { X, Plus, TrendingUp } from 'lucide-react';
import { PortfolioItem, PORTFOLIO_CATEGORIES, GOLD_TYPES } from '../../types/portfolio';

import { formatCurrency } from '../../utils/currency';

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
    purchaseDate: new Date().toISOString().split('T')[0],
    // Vadeli hesap için ek alanlar
    annualInterestRate: '',
    taxExemptPercentage: '10',
    maturityDate: '',
    bankName: '',
    calculatedNetReturn: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Net getiri hesaplama fonksiyonu
  const calculateNetReturn = (annualRate: string, taxExemptPercentage: string, purchasePrice: string) => {
    const rate = parseFloat(annualRate || '0');
    const exempt = parseFloat(taxExemptPercentage || '0');
    const price = parseFloat(purchasePrice || '0');
    
    if (rate > 0 && price > 0) {
      // Vadeli hesap için toplam tutar = yatırım tutarı (purchasePrice)
      const totalAmount = price;
      
      // Yıllık brüt faiz hesaplama (tüm tutardan)
      const grossInterest = totalAmount * (rate / 100);
      
      // Faiz işlemeyecek kısım (faizden düşülür)
      const exemptInterest = grossInterest * (exempt / 100);
      
      // Faiz işleyecek kısım
      const taxableInterest = grossInterest - exemptInterest;
      
      // %17.5 stopaj vergisi (sadece faiz işleyecek kısımdan)
      const withholdingTax = taxableInterest * 0.175;
      
      // Net yıllık getiri
      const netReturn = grossInterest - withholdingTax;
      
      setFormData(prev => ({ ...prev, calculatedNetReturn: netReturn }));
    } else {
      setFormData(prev => ({ ...prev, calculatedNetReturn: 0 }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Vadeli hesap dışındaki yatırımlar için validasyonlar
    if (formData.type !== 'deposit') {
      if (!formData.symbol.trim()) {
        newErrors.symbol = 'Sembol gereklidir';
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        newErrors.quantity = 'Geçerli bir miktar giriniz';
      }
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = formData.type === 'deposit' ? 'Geçerli bir yatırım tutarı giriniz' : 'Geçerli bir alış fiyatı giriniz';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Alış tarihi gereklidir';
    }

    // Vadeli hesap için ek validasyonlar
    if (formData.type === 'deposit') {
      if (!formData.annualInterestRate || parseFloat(formData.annualInterestRate) <= 0) {
        newErrors.annualInterestRate = 'Geçerli bir yıllık faiz oranı giriniz';
      }
      if (!formData.maturityDate) {
        newErrors.maturityDate = 'Vade tarihi gereklidir';
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = 'Banka adı gereklidir';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const portfolioItem: any = {
      type: formData.type,
      name: formData.type === 'deposit' ? `${formData.bankName} Vadeli Hesap` : formData.name.trim(),
      symbol: formData.type === 'deposit' ? 'DEPOSIT' : formData.symbol.trim().toUpperCase(),
      quantity: formData.type === 'deposit' ? 1 : parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: formData.purchaseDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '' // Bu değer PortfolioService tarafından doldurulacak
    };

    // Vadeli hesap için metadata ekle
    if (formData.type === 'deposit') {
      portfolioItem.metadata = {
        annualInterestRate: parseFloat(formData.annualInterestRate),
        taxExemptPercentage: parseFloat(formData.taxExemptPercentage),
        maturityDate: formData.maturityDate,
        bankName: formData.bankName.trim(),
        calculatedNetReturn: formData.calculatedNetReturn
      };
    }

    // Otomatik getiri başlatma işlemi PortfolioPage'de yapılacak

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
      purchaseDate: new Date().toISOString().split('T')[0],
      annualInterestRate: '',
      taxExemptPercentage: '10',
      maturityDate: '',
      bankName: '',
      calculatedNetReturn: 0
    });
    setErrors({});
    onClose();
  };

  const getSymbolOptions = () => {
    switch (formData.type) {
      case 'gold':
        return Object.entries(GOLD_TYPES).map(([key, value]) => ({ key, value }));
      case 'currency':
        return [
          { key: 'USD', value: 'ABD Doları' },
          { key: 'EUR', value: 'Euro' }
        ];
      default:
        return [];
    }
  };

  

  const handleTypeChange = (type: keyof typeof PORTFOLIO_CATEGORIES) => {
    const newFormData = {
      ...formData,
      type,
      symbol: '',
      name: '',
      annualInterestRate: '',
      taxExemptPercentage: '10',
      maturityDate: '',
      bankName: '',
      calculatedNetReturn: 0
    };
    
    // Altın türü seçildiğinde otomatik olarak GRAM seç
    if (type === 'gold') {
      newFormData.symbol = 'GRAM';
      newFormData.name = 'Gram Altın';
    }
    
    setFormData(newFormData);
    setErrors({});
  };

  const handleSymbolChange = (symbol: string) => {
    let name = '';
    
    if (formData.type === 'gold' && GOLD_TYPES[symbol as keyof typeof GOLD_TYPES]) {
      name = GOLD_TYPES[symbol as keyof typeof GOLD_TYPES];
    } else if (formData.type === 'currency') {
      if (symbol === 'USD') {
        name = 'ABD Doları';
      } else if (symbol === 'EUR') {
        name = 'Euro';
      }
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

          {/* Sembol - Altın için gizle */}
          {formData.type !== 'gold' && (
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
          )}



          {/* Miktar ve Alış Fiyatı */}
          <div className="grid grid-cols-2 gap-4">
            {/* Vadeli hesap için miktar alanını gizle */}
            {formData.type !== 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'gold' ? 'Gram' : 'Miktar'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, quantity: newValue }));
                    calculateNetReturn(formData.annualInterestRate, formData.taxExemptPercentage, formData.purchasePrice);
                  }}
                  placeholder="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>
            )}
            
            {/* Vadeli hesap için tutar alanı */}
            {formData.type === 'deposit' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yatırım Tutarı (₺)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.purchasePrice}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, purchasePrice: newValue, quantity: '1' }));
                    calculateNetReturn(formData.annualInterestRate, formData.taxExemptPercentage, newValue);
                  }}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.purchasePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
                )}
              </div>
            )}

            {/* Vadeli hesap dışındaki yatırımlar için alış fiyatı */}
            {formData.type !== 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.purchasePrice}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, purchasePrice: newValue }));
                    calculateNetReturn(formData.annualInterestRate, formData.taxExemptPercentage, newValue);
                  }}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.purchasePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
                )}
              </div>
            )}
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

          {/* Vadeli Hesap için Ek Alanlar */}
          {formData.type === 'deposit' && (
            <>
              {/* Yıllık Faiz Oranı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yıllık Faiz Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annualInterestRate}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, annualInterestRate: newValue }));
                    calculateNetReturn(newValue, formData.taxExemptPercentage, formData.purchasePrice);
                  }}
                  placeholder="Örn: 15.50"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.annualInterestRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.annualInterestRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.annualInterestRate}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Bankanın verdiği yıllık faiz oranını giriniz
                </p>
              </div>

              {/* Faiz İşlenmeyen Yüzde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faiz İşlenmeyen Yüzde
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['10', '15'].map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, taxExemptPercentage: percentage }));
                        calculateNetReturn(formData.annualInterestRate, percentage, formData.purchasePrice);
                      }}
                      className={`px-4 py-3 border rounded-lg font-medium transition-colors ${
                        formData.taxExemptPercentage === percentage
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      %{percentage}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Faizin vergiden muaf olan kısmını seçiniz
                </p>
              </div>

              {/* Vade Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vade Tarihi
                </label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.maturityDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maturityDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.maturityDate}</p>
                )}
              </div>

              {/* Banka Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banka Adı
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Örn: Ziraat Bankası"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                )}
              </div>

              {/* Net Getiri Hesaplaması */}
              {formData.calculatedNetReturn > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Net Getiri Hesaplaması</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    {(() => {
                      const totalAmount = parseFloat(formData.quantity || '0') * parseFloat(formData.purchasePrice || '0');
                      const exemptAmount = totalAmount * parseFloat(formData.taxExemptPercentage) / 100;
                      const taxableAmount = totalAmount - exemptAmount;
                      const grossInterest = taxableAmount * parseFloat(formData.annualInterestRate || '0') / 100;
                      const withholdingTax = grossInterest * 0.175;
                      
                      return (
                        <>
                          <p>Toplam Yatırım: {formatCurrency(totalAmount)}</p>
                          <p>Faiz İşlemeyecek Kısım (%{formData.taxExemptPercentage}): {formatCurrency(exemptAmount)}</p>
                          <p>Faiz İşleyecek Kısım: {formatCurrency(taxableAmount)}</p>
                          <p>Yıllık Brüt Faiz: {formatCurrency(grossInterest)}</p>
                          <p>Stopaj Vergisi (%17.5): {formatCurrency(withholdingTax)}</p>
                          <div className="border-t border-green-300 pt-2 mt-2">
                            <p className="font-semibold">Günlük Net Getiri: {formatCurrency(formData.calculatedNetReturn)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

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