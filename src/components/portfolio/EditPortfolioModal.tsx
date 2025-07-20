import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { PortfolioItem, PORTFOLIO_CATEGORIES, GOLD_TYPES } from '../../types/portfolio';
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
    purchasePrice: item.purchasePrice,
    currentPrice: item.currentPrice,
    purchaseDate: item.purchaseDate,
    annualInterestRate: item.metadata?.annualInterestRate?.toString() || '',
    taxExemptPercentage: item.metadata?.taxExemptPercentage?.toString() || '10',
    bankName: item.metadata?.bankName || '',
    calculatedNetReturn: item.metadata?.calculatedNetReturn || 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Güncel fiyat hesaplama fonksiyonu (vadeli hesap için)
  const calculateCurrentPrice = (annualRate: string, taxExemptPercentage: string, purchasePrice: number, purchaseDate: string) => {
    const rate = parseFloat(annualRate || '0');
    const exempt = parseFloat(taxExemptPercentage || '0');
    
    if (rate > 0 && purchasePrice > 0 && purchaseDate) {
      const startDate = new Date(purchaseDate);
      const currentDate = new Date();
      const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Faiz işlemeyecek kısım (ana paradan düşülür)
      const exemptAmount = purchasePrice * (exempt / 100);
      
      // Faiz işleyecek kısım
      const taxableAmount = purchasePrice - exemptAmount;
      
      // Günlük net getiri hesaplama
      const dailyGrossInterest = taxableAmount * (rate / 100) / 365;
      const dailyWithholdingTax = dailyGrossInterest * 0.175;
      const dailyNetReturn = dailyGrossInterest - dailyWithholdingTax;
      
      // Toplam kazanç
      const totalEarnings = dailyNetReturn * daysPassed;
      
      // Güncel fiyat = Alış fiyatı + Toplam kazanç
      const currentPrice = purchasePrice + totalEarnings;
      
      setFormData(prev => ({ 
        ...prev, 
        currentPrice: currentPrice,
        calculatedNetReturn: totalEarnings 
      }));
      
      return currentPrice;
    } else {
      setFormData(prev => ({ ...prev, calculatedNetReturn: 0, currentPrice: purchasePrice }));
      return purchasePrice;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: item.name,
        symbol: item.symbol,
        type: item.type,
        purchasePrice: item.purchasePrice,
        currentPrice: item.currentPrice,
        purchaseDate: item.purchaseDate,
        annualInterestRate: item.metadata?.annualInterestRate?.toString() || '',
        taxExemptPercentage: item.metadata?.taxExemptPercentage?.toString() || '10',
        bankName: item.metadata?.bankName || '',
        calculatedNetReturn: item.metadata?.calculatedNetReturn || 0
      });
      setErrors({});
      
      // Vadeli hesap ise güncel fiyatı hesapla
      if (item.type === 'deposit' && item.metadata?.annualInterestRate) {
        calculateCurrentPrice(
          item.metadata.annualInterestRate.toString(),
          item.metadata.taxExemptPercentage?.toString() || '10',
          item.purchasePrice,
          item.purchaseDate
        );
      }
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

    if (formData.type !== 'deposit' && item.quantity <= 0) {
      newErrors.quantity = 'Miktar 0\'dan büyük olmalıdır';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Alış fiyatı 0\'dan büyük olmalıdır';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Alış tarihi gereklidir';
    }

    // Vadeli hesap için ek validasyonlar
    if (formData.type === 'deposit') {
      if (!formData.annualInterestRate || parseFloat(formData.annualInterestRate) <= 0) {
        newErrors.annualInterestRate = 'Yıllık faiz oranı 0\'dan büyük olmalıdır';
      }



      if (!formData.bankName.trim()) {
        newErrors.bankName = 'Banka adı gereklidir';
      }
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
      let updateData: Partial<PortfolioItem>;
      
      if (formData.type === 'deposit') {
        // Vadeli hesap için
        const currentPrice = formData.currentPrice;
        const totalValue = currentPrice; // Vadeli hesapta miktar 1 olarak kabul edilir
        const totalInvestment = formData.purchasePrice;
        const totalReturn = totalValue - totalInvestment;
        const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        
        updateData = {
          name: formData.name,
          symbol: formData.symbol,
          type: formData.type,
          quantity: 1, // Vadeli hesap için miktar her zaman 1
          purchasePrice: formData.purchasePrice,
          purchaseDate: formData.purchaseDate,
          currentPrice,
          totalValue,
          totalReturn,
          returnPercentage,
          lastUpdated: new Date()
        };
      } else {
        // Diğer yatırım türleri için
        const currentPrice = formData.currentPrice || formData.purchasePrice;
        const totalValue = item.quantity * currentPrice;
        const totalInvestment = item.quantity * formData.purchasePrice;
        const totalReturn = totalValue - totalInvestment;
        const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        
        updateData = {
          name: formData.name,
          symbol: formData.symbol,
          type: formData.type,
          quantity: item.quantity, // Mevcut miktarı koru
          purchasePrice: formData.purchasePrice,
          purchaseDate: formData.purchaseDate,
          currentPrice,
          totalValue,
          totalReturn,
          returnPercentage,
          lastUpdated: new Date()
        };
      }

      // Vadeli hesap için metadata ekle
      if (formData.type === 'deposit') {
        updateData.metadata = {
          annualInterestRate: parseFloat(formData.annualInterestRate),
          taxExemptPercentage: parseFloat(formData.taxExemptPercentage),
          bankName: formData.bankName.trim(),
          calculatedNetReturn: formData.calculatedNetReturn
        };
      }
      
      await onUpdate(item.id, updateData);
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
    } else if (formData.type === 'currency') {
      return [
        { key: 'USD', value: 'ABD Doları' },
        { key: 'EUR', value: 'Euro' }
      ];
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
            {(formData.type === 'gold' || formData.type === 'currency') ? (
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

          {/* Miktar - Sadece vadeli hesap dışındaki yatırımlar için */}
          {formData.type !== 'deposit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miktar
              </label>
              <input
                type="number"
                value={item.quantity}
                onChange={() => {
                  // Miktar değişikliği için parent component'e bildirim gönderilecek
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
                min="0"
                step="any"
                required
              />
            </div>
          )}

          {/* Alış Fiyatı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alış Fiyatı (TL)
            </label>
            <input
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => {
                const newPrice = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, purchasePrice: newPrice });
                setErrors({ ...errors, purchasePrice: '' });
                if (formData.type === 'deposit') {
                  calculateCurrentPrice(formData.annualInterestRate, formData.taxExemptPercentage, newPrice, formData.purchaseDate);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>}
          </div>

          {/* Güncel Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'deposit' ? 'Güncel Değer (Otomatik Hesaplanır)' : 'Güncel Fiyat (TL)'}
            </label>
            <input
              type="number"
              value={formData.currentPrice}
              onChange={(e) => {
                if (formData.type !== 'deposit') {
                  setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 });
                  setErrors({ ...errors, currentPrice: '' });
                }
              }}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formData.type === 'deposit' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
              readOnly={formData.type === 'deposit'}
            />
            {formData.type === 'deposit' && (
              <p className="text-sm text-gray-600 mt-1">
                Vadeli hesap için güncel değer otomatik olarak hesaplanır
              </p>
            )}
            {errors.currentPrice && <p className="text-red-500 text-sm mt-1">{errors.currentPrice}</p>}
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
                if (formData.type === 'deposit') {
                  calculateCurrentPrice(formData.annualInterestRate, formData.taxExemptPercentage, formData.purchasePrice, e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.purchaseDate && <p className="text-red-500 text-sm mt-1">{errors.purchaseDate}</p>}
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
                    setErrors({ ...errors, annualInterestRate: '' });
                    calculateCurrentPrice(newValue, formData.taxExemptPercentage, formData.purchasePrice, formData.purchaseDate);
                  }}
                  placeholder="Örn: 15.50"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.annualInterestRate ? 'border-red-500' : ''
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
                        calculateCurrentPrice(formData.annualInterestRate, percentage, formData.purchasePrice, formData.purchaseDate);
                      }}
                      className={`px-3 py-2 border rounded-lg font-medium transition-colors ${
                        formData.taxExemptPercentage === percentage
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
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



              {/* Banka Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banka Adı
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, bankName: e.target.value }));
                    setErrors({ ...errors, bankName: '' });
                  }}
                  placeholder="Örn: Ziraat Bankası"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.bankName ? 'border-red-500' : ''
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
                      const startDate = new Date(formData.purchaseDate);
                      const currentDate = new Date();
                      const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      const exemptAmount = formData.purchasePrice * parseFloat(formData.taxExemptPercentage) / 100;
                      const taxableAmount = formData.purchasePrice - exemptAmount;
                      const dailyGrossInterest = taxableAmount * parseFloat(formData.annualInterestRate || '0') / 100 / 365;
                      const dailyWithholdingTax = dailyGrossInterest * 0.175;
                      const dailyNetReturn = dailyGrossInterest - dailyWithholdingTax;
                      
                      return (
                        <>
                          <p>Alış Fiyatı: {formatCurrency(formData.purchasePrice)}</p>
                          <p>Faiz İşlemeyecek Kısım (%{formData.taxExemptPercentage}): {formatCurrency(exemptAmount)}</p>
                          <p>Faiz İşleyecek Kısım: {formatCurrency(taxableAmount)}</p>
                          <p>Günlük Brüt Faiz: {formatCurrency(dailyGrossInterest)}</p>
                          <p>Günlük Stopaj Vergisi (%17.5): {formatCurrency(dailyWithholdingTax)}</p>
                          <p>Günlük Net Getiri: {formatCurrency(dailyNetReturn)}</p>
                          <p>Geçen Gün Sayısı: {daysPassed} gün</p>
                          <div className="border-t border-green-300 pt-2 mt-2">
                            <p className="font-semibold">Toplam Kazanç: {formatCurrency(formData.calculatedNetReturn)}</p>
                            <p className="font-semibold">Güncel Değer: {formatCurrency(formData.currentPrice)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

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