import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Euro, PoundSterling } from 'lucide-react';
import { exchangeRateService, ExchangeRate } from '../../services/exchange-rate.service';
import { portfolioService } from '../../services/portfolio.service';
import { PortfolioItem } from '../../types/portfolio';
import { useAuth } from '../../contexts/AuthContext';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  portfolioItems: PortfolioItem[];
}

const EXCHANGE_SYMBOLS = [
  { symbol: 'USD', name: 'Amerikan Doları', icon: DollarSign, color: 'text-green-600' },
  { symbol: 'EUR', name: 'Euro', icon: Euro, color: 'text-blue-600' },
  { symbol: 'GBP', name: 'İngiliz Sterlini', icon: PoundSterling, color: 'text-yellow-600' },
  { symbol: 'GOLD', name: 'Altın (Gram)', icon: TrendingUp, color: 'text-yellow-600' },
  { symbol: 'XAU', name: 'Altın (XAU)', icon: TrendingUp, color: 'text-yellow-500' },
  { symbol: 'SILVER', name: 'Gümüş (Gram)', icon: TrendingUp, color: 'text-gray-600' }
];

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  portfolioItems
}) => {
  const { user } = useAuth();
  const [rates, setRates] = useState<{ [key: string]: string }>({});
  const [currentRates, setCurrentRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      loadCurrentRates();
    }
  }, [isOpen]);

  const loadCurrentRates = async () => {
    try {
      const currentRates = await exchangeRateService.getAllCurrentRates();
      setCurrentRates(currentRates);
      
      // Mevcut kurları form alanlarına doldur
      const rateMap: { [key: string]: string } = {};
      currentRates.forEach(rate => {
        rateMap[rate.symbol] = rate.rate.toString();
      });
      setRates(rateMap);
    } catch (error) {
      console.error('Error loading current rates:', error);
    }
  };

  const handleRateChange = (symbol: string, value: string) => {
    setRates(prev => ({ ...prev, [symbol]: value }));
    
    // Hata varsa temizle
    if (errors[symbol]) {
      setErrors(prev => ({ ...prev, [symbol]: '' }));
    }
  };

  // Portföyde bulunan sembolleri al
  const getPortfolioSymbols = () => {
    const symbols = new Set<string>();
    portfolioItems.forEach(item => {
      // Tüm yatırım türlerini dahil et
      symbols.add(item.symbol);
    });
    return Array.from(symbols).map(symbol => {
      const symbolData = EXCHANGE_SYMBOLS.find(s => s.symbol === symbol);
      return symbolData || { symbol, name: symbol, icon: TrendingUp, color: 'text-gray-600' };
    });
  };

  const activeSymbols = getPortfolioSymbols();

  const validateRates = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    activeSymbols.forEach(({ symbol }) => {
      const value = rates[symbol];
      if (!value || value.trim() === '') {
        newErrors[symbol] = 'Bu alan zorunludur';
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          newErrors[symbol] = 'Geçerli bir pozitif sayı giriniz';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRates() || !user) {
      return;
    }
    
    setLoading(true);
    
    try {
      const today = new Date();
      
      // Her sembol için kur ekle ve portföy öğelerini güncelle
      for (const { symbol, name } of activeSymbols) {
        const rate = parseFloat(rates[symbol]);
        
        // Bugün için kur var mı kontrol et
        const hasToday = await exchangeRateService.hasTodayRate(symbol);
        
        if (hasToday) {
          // Güncelle (mevcut kaydı bul ve güncelle)
          const currentRate = currentRates.find(r => r.symbol === symbol);
          if (currentRate && currentRate.id) {
            await exchangeRateService.updateExchangeRate(currentRate.id, {
              rate,
              date: today
            });
          }
        } else {
          // Yeni kayıt ekle
          await exchangeRateService.addExchangeRate({
            symbol,
            name,
            rate,
            date: today
          });
        }
        
        // Aynı sembol türündeki tüm portföy öğelerini güncelle
        await portfolioService.updatePortfolioItemsBySymbol(user.uid, symbol, rate);
      }
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRateForSymbol = (symbol: string): number | null => {
    const currentRate = currentRates.find(r => r.symbol === symbol);
    return currentRate ? currentRate.rate : null;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fiyat Güncelleme</h2>
            <p className="text-sm text-gray-600 mt-1">
              Bugün ({formatDate(new Date())}) için yatırım fiyatlarını güncelleyin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeSymbols.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Portföyünüzde Yatırım Yok</h3>
              <p className="text-gray-600">Yatırım ekledikten sonra fiyatları buradan güncelleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeSymbols.map(({ symbol, name, icon: Icon, color }) => {
              const currentRate = getCurrentRateForSymbol(symbol);
              
              return (
                <div key={symbol} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gray-50`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900">
                          {name} ({symbol})
                        </label>
                        {currentRate && (
                          <p className="text-xs text-gray-500">
                            Mevcut: {currentRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates[symbol] || ''}
                      onChange={(e) => handleRateChange(symbol, e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors[symbol] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">TL</span>
                    </div>
                  </div>
                  
                  {errors[symbol] && (
                    <p className="text-sm text-red-600">{errors[symbol]}</p>
                  )}
                </div>
              );
            })}
            </div>
          )}

          {activeSymbols.length > 0 && (
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                  <span>Fiyatları Güncelle</span>
                )}
            </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ExchangeRateModal;