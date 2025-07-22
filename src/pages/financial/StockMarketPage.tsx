import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, Star, Activity } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface StockData {
  name: string;
  price: string;
  change: string;
  time: string;
  last?: string;
  yesterday?: string;
  percent?: string;
  high?: string;
  low?: string;
  volume?: string;
  volumePrice?: string;
}



interface MarketData {
  Bist100: string;
  Bist100Degisim: string;
  Dolar: string;
  DolarDegisim: string;
  Euro: string;
  EuroDegisim: string;
  Altin: string;
  AltinDegisim: string;
  Petrol: string;
  PetrolDegisim: string;
  Bono: string;
  BonoDegisim: string;
}

type TabType = 'all' | 'bist50' | 'bist30' | 'rising' | 'falling' | 'indices' | 'favorites';

const StockMarketPage: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [bist50Stocks, setBist50Stocks] = useState<StockData[]>([]);
  const [bist30Stocks, setBist30Stocks] = useState<StockData[]>([]);
  const [indices, setIndices] = useState<StockData[]>([]);
  const [risingStocks, setRisingStocks] = useState<StockData[]>([]);
  const [fallingStocks, setFallingStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const { user } = useAuth();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Paralel olarak tüm verileri çek
      const [allStocksRes, bist50Res, bist30Res, indicesRes, risingRes, fallingRes, marketRes] = await Promise.all([
        fetch('https://doviz-api.onrender.com/api/borsaAll'),
        fetch('https://doviz-api.onrender.com/api/borsa50'),
        fetch('https://doviz-api.onrender.com/api/borsa30'),
        fetch('https://doviz-api.onrender.com/api/indices'),
        fetch('https://doviz-api.onrender.com/api/highest'),
        fetch('https://doviz-api.onrender.com/api/lowest'),
        fetch('https://doviz-api.onrender.com/api')
      ]);
      
      const [allStocks, bist50Data, bist30Data, indicesData, risingData, fallingData, marketDataRes] = await Promise.all([
        allStocksRes.json(),
        bist50Res.json(),
        bist30Res.json(),
        indicesRes.json(),
        risingRes.json(),
        fallingRes.json(),
        marketRes.json()
      ]);
      
      if (allStocks.success && allStocks.data) {
        setStocks(allStocks.data);
      }
      
      if (bist50Data.success && bist50Data.data) {
        setBist50Stocks(bist50Data.data);
      }
      
      if (bist30Data.success && bist30Data.data) {
        setBist30Stocks(bist30Data.data);
      }
      
      if (indicesData.success && indicesData.data) {
        setIndices(indicesData.data);
      }
      
      if (risingData.success && risingData.data) {
        setRisingStocks(risingData.data);
      }
      
      if (fallingData.success && fallingData.data) {
        setFallingStocks(fallingData.data);
      }
      
      if (marketDataRes.success && marketDataRes.data && marketDataRes.data[0]) {
        setMarketData(marketDataRes.data[0]);
      }
      
      setLastUpdate(new Date());
      
      // Firebase'e kaydet
      if (user) {
        await setDoc(doc(db, 'stockData', 'latest'), {
          allStocks: allStocks.data || [],
          bist50: bist50Data.data || [],
          bist30: bist30Data.data || [],
          indices: indicesData.data || [],
          rising: risingData.data || [],
          falling: fallingData.data || [],
          marketData: marketDataRes.data?.[0] || null,
          lastUpdate: new Date(),
          userId: user.uid
        });
      }
    } catch (error) {
      console.error('Borsa verileri alınırken hata:', error);
      
      // Hata durumunda Firebase'den son veriyi al
      if (user) {
        try {
          const docRef = doc(db, 'stockData', 'latest');
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const savedData = docSnap.data();
            setStocks(savedData.allStocks || []);
            setBist50Stocks(savedData.bist50 || []);
            setBist30Stocks(savedData.bist30 || []);
            setIndices(savedData.indices || []);
            setRisingStocks(savedData.rising || []);
            setFallingStocks(savedData.falling || []);
            setMarketData(savedData.marketData || null);
            setLastUpdate(savedData.lastUpdate?.toDate() || null);
          }
        } catch (firebaseError) {
          console.error('Firebase verisi alınırken hata:', firebaseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'userFavorites', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setFavorites(docSnap.data().favorites || []);
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    }
  };

  const toggleFavorite = async (stockName: string) => {
    if (!user) return;
    
    const newFavorites = favorites.includes(stockName)
      ? favorites.filter(f => f !== stockName)
      : [...favorites, stockName];
    
    setFavorites(newFavorites);
    
    try {
      await setDoc(doc(db, 'userFavorites', user.uid), {
        favorites: newFavorites,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Favori güncellenirken hata:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
      loadFavorites();
    }
    
    // Saatlik güncelleme
    const interval = setInterval(() => {
      if (user) {
        fetchAllData();
      }
    }, 5 * 60 * 1000); // 5 dakika
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const currentStocks = getCurrentStockData();
    
    const filtered = currentStocks.filter(stock =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStocks(filtered);
  }, [searchTerm, stocks, bist50Stocks, bist30Stocks, risingStocks, fallingStocks, indices, favorites, activeTab]);

  const getCurrentStockData = () => {
    switch (activeTab) {
      case 'all':
        return stocks;
      case 'bist50':
        return bist50Stocks;
      case 'bist30':
        return bist30Stocks;
      case 'rising':
        return risingStocks;
      case 'falling':
        return fallingStocks;
      case 'indices':
        return indices;
      case 'favorites':
        return stocks.filter(stock => favorites.includes(stock.name));
      default:
        return stocks;
    }
  };

  const formatPrice = (price: string) => {
    // Türkçe format: "4.459,25" -> "4.459,25 ₺"
    return `${price} ₺`;
  };

  const formatChange = (change: string) => {
    const numChange = parseFloat(change.replace(',', '.'));
    return {
      value: change,
      isPositive: numChange >= 0,
      formatted: `${numChange >= 0 ? '+' : ''}${change}%`
    };
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Borsa İstanbul (BIST)
            </h1>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-gray-600">
              Son güncelleme: {lastUpdate.toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {/* Market Data Box */}
        {marketData && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Otomatik Çekilen Veriler</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">BIST 100</p>
                <p className="font-semibold">{marketData.Bist100}</p>
                <p className={`text-xs ${marketData.Bist100Degisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.Bist100Degisim}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">USD/TRY</p>
                <p className="font-semibold">{marketData.Dolar}</p>
                <p className={`text-xs ${marketData.DolarDegisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.DolarDegisim}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">EUR/TRY</p>
                <p className="font-semibold">{marketData.Euro}</p>
                <p className={`text-xs ${marketData.EuroDegisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.EuroDegisim}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Altın</p>
                <p className="font-semibold">{marketData.Altin}</p>
                <p className={`text-xs ${marketData.AltinDegisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.AltinDegisim}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Petrol</p>
                <p className="font-semibold">{marketData.Petrol}</p>
                <p className={`text-xs ${marketData.PetrolDegisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.PetrolDegisim}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Bono</p>
                <p className="font-semibold">{marketData.Bono}</p>
                <p className={`text-xs ${marketData.BonoDegisim.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  {marketData.BonoDegisim}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'bist50', label: 'BIST 50' },
              { key: 'bist30', label: 'BIST 30' },
              { key: 'rising', label: 'Yükselenler' },
              { key: 'falling', label: 'Düşenler' },
              { key: 'indices', label: 'İndeksler' },
              { key: 'favorites', label: 'Favoriler' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Hisse senedi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Toplam Hisse
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {getCurrentStockData().length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Yükselen
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {getCurrentStockData().filter(stock => parseFloat((stock.change || stock.percent || '0').replace(',', '.')) > 0).length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Düşen
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {getCurrentStockData().filter(stock => parseFloat((stock.change || stock.percent || '0').replace(',', '.')) < 0).length}
            </p>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block sm:hidden space-y-4">
          {filteredStocks.map((stock, index) => {
            const changeData = formatChange(stock.change || stock.percent || '0');
            return (
              <div key={`${stock.name}-${index}`} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(stock.name)}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          favorites.includes(stock.name) 
                            ? 'fill-yellow-500 text-yellow-500' 
                            : ''
                        }`} 
                      />
                    </button>
                    <h3 className="font-semibold text-gray-900 text-sm">{stock.name}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(stock.time || '-')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{formatPrice(stock.price || stock.last || '0')}</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    changeData.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {changeData.isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {changeData.formatted}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favori
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sembol
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fiyat
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değişim
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Güncelleme Saati
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock, index) => {
                  const changeData = formatChange(stock.change || stock.percent || '0');
                  return (
                    <tr key={`${stock.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleFavorite(stock.name)}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          <Star 
                            className={`w-5 h-5 ${
                              favorites.includes(stock.name) 
                                ? 'fill-yellow-500 text-yellow-500' 
                                : ''
                            }`} 
                          />
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stock.name}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(stock.price || stock.last || '0')}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                          changeData.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {changeData.isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {changeData.formatted}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-500">
                          {formatTime(stock.time || '-')}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredStocks.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">
              {searchTerm ? 'Arama kriterinize uygun hisse senedi bulunamadı.' : 'Henüz veri yok.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMarketPage;