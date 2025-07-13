import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Edit3, X } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/currency';

interface PriceUpdatePanelProps {
  portfolioItems: any[];
  onRefresh: () => void;
}

interface PriceData {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
  status: 'loading' | 'success' | 'error';
}

export const PriceUpdatePanel: React.FC<PriceUpdatePanelProps> = ({ portfolioItems, onRefresh }) => {
  const { user } = useAuth();
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    if (portfolioItems.length > 0) {
      initializePriceData();
    }
  }, [portfolioItems]);

  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(() => {
        updateAllPrices();
      }, 60000); // Her dakika güncelle
      setUpdateInterval(interval);
    } else {
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [autoUpdate]);

  const initializePriceData = () => {
    const initialData: Record<string, PriceData> = {};
    // Get unique symbols only
    const uniqueSymbols = [...new Set(portfolioItems.map(item => item.symbol))];
    uniqueSymbols.forEach(symbol => {
      const item = portfolioItems.find(p => p.symbol === symbol);
      if (item) {
        initialData[symbol] = {
          symbol: symbol,
          currentPrice: item.currentPrice || 0,
          previousPrice: item.currentPrice || 0,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date(),
          status: 'success'
        };
      }
    });
    setPriceData(initialData);
  };

  // Simulated price update function - In real app, this would call actual APIs
  const fetchPriceForSymbol = async (symbol: string): Promise<{ price: number; change: number; changePercent: number }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate price changes
    const currentPrice = priceData[symbol]?.currentPrice || 100;
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5% change
    const newPrice = currentPrice * (1 + changePercent / 100);
    const change = newPrice - currentPrice;
    
    return {
      price: Math.max(0.01, newPrice), // Ensure price is positive
      change,
      changePercent
    };
  };

  const updatePriceForSymbol = async (symbol: string) => {
    if (!user) return;

    setPriceData(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        status: 'loading'
      }
    }));

    try {
      const { price, change, changePercent } = await fetchPriceForSymbol(symbol);
      
      // Update local state
      setPriceData(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          previousPrice: prev[symbol]?.currentPrice || price,
          currentPrice: price,
          change,
          changePercent,
          lastUpdated: new Date(),
          status: 'success'
        }
      }));

      // Update Firebase
      const portfolioItem = portfolioItems.find(item => item.symbol === symbol);
      if (portfolioItem) {
        await updateDoc(
          doc(db, 'teknokapsul', user.uid, 'portfolio', portfolioItem.id),
          {
            currentPrice: price,
            lastUpdated: new Date()
          }
        );
      }
    } catch (error) {
      console.error(`Error updating price for ${symbol}:`, error);
      setPriceData(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          status: 'error'
        }
      }));
    }
  };

  const updateAllPrices = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const symbols = portfolioItems.map(item => item.symbol);
    
    try {
      await Promise.all(symbols.map(symbol => updatePriceForSymbol(symbol)));
      setLastUpdateTime(new Date());
      onRefresh(); // Refresh parent component
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleEditPrice = (item: any) => {
    setEditingItem(item);
    setEditPrice(item.currentPrice?.toString() || '');
  };

  const handleSavePrice = async () => {
    if (!user || !editingItem) return;

    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Lütfen geçerli bir fiyat girin');
      return;
    }

    try {
      // Update Firebase
      await updateDoc(
        doc(db, 'teknokapsul', user.uid, 'portfolio', editingItem.id),
        {
          currentPrice: newPrice,
          lastUpdated: new Date()
        }
      );

      // Update local state
      setPriceData(prev => ({
        ...prev,
        [editingItem.symbol]: {
          ...prev[editingItem.symbol],
          previousPrice: prev[editingItem.symbol]?.currentPrice || newPrice,
          currentPrice: newPrice,
          change: newPrice - (prev[editingItem.symbol]?.currentPrice || newPrice),
          changePercent: prev[editingItem.symbol]?.currentPrice 
            ? ((newPrice - prev[editingItem.symbol].currentPrice) / prev[editingItem.symbol].currentPrice) * 100
            : 0,
          lastUpdated: new Date(),
          status: 'success'
        }
      }));

      setEditingItem(null);
      setEditPrice('');
      onRefresh();
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Fiyat güncellenirken hata oluştu');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditPrice('');
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Fiyat Güncelleme</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoUpdate"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="autoUpdate" className="text-sm text-gray-700">
              Otomatik güncelleme
            </label>
          </div>
          <button
            onClick={updateAllPrices}
            disabled={isUpdating}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Güncelleniyor...' : 'Fiyatları Güncelle'}
          </button>
        </div>
      </div>

      {lastUpdateTime && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Son güncelleme: {formatTime(lastUpdateTime)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {portfolioItems
          .filter((item, index, self) => 
            index === self.findIndex(i => i.symbol === item.symbol)
          )
          .map(item => {
          const price = priceData[item.symbol];
          if (!price) return null;

          const isPositive = price.change >= 0;
          
          return (
            <div key={item.symbol} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(price.status)}
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{item.symbol}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-600 truncate">{item.name}</span>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(price.currentPrice)}
                  </p>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}{formatCurrency(price.change)} ({isPositive ? '+' : ''}{price.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditPrice(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="Fiyatı düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updatePriceForSymbol(item.symbol)}
                    disabled={price.status === 'loading'}
                    className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Bu sembolü güncelle"
                  >
                    <RefreshCw className={`w-4 h-4 ${price.status === 'loading' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {portfolioItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Portföyünüzde henüz yatırım bulunmuyor.</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Bilgi</p>
            <p className="text-xs text-yellow-700 mt-1">
              Bu demo sürümde fiyatlar simüle edilmektedir. Gerçek uygulamada canlı piyasa verisi kullanılacaktır.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Fiyat Düzenle - {editingItem.symbol}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Birim Fiyat
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Yeni fiyat girin"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSavePrice}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};