import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, Brain, RefreshCw, PieChart, Clock, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioService } from '../../services/portfolio.service';
import { PortfolioItem, AIRecommendation, PORTFOLIO_CATEGORIES } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AddPortfolioModal } from '../../components/portfolio/AddPortfolioModal';
import { PortfolioItemCard } from '../../components/portfolio/PortfolioItemCard';
import { AIRecommendationsPanel } from '../../components/portfolio/AIRecommendationsPanel';
import { PortfolioChart } from '../../components/portfolio/PortfolioChart';
import { ExchangeRateModal } from '../../components/portfolio/ExchangeRateModal';
import { PriceUpdatePanel } from '../../components/portfolio/PriceUpdatePanel';
import { PortfolioAnalytics } from '../../components/portfolio/PortfolioAnalytics';
import { PortfolioDetailsModal } from '../../components/portfolio/PortfolioDetailsModal';
import { exchangeRateService } from '../../services/exchange-rate.service';
import { depositAutoReturnService } from '../../services/deposit-auto-return.service';
import { useNavigate } from 'react-router-dom';

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'investments' | 'returns' | 'prices'>('investments');
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [showValues] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [showDepositSettingsModal, setShowDepositSettingsModal] = useState(false);
  const [depositAutoReturnActive, setDepositAutoReturnActive] = useState(false);

  useEffect(() => {
    if (user) {
      initializeExchangeRates();
      loadPortfolioData();
      checkDepositAutoReturnStatus();
      
      const updateAllPrices = async () => {
        try {
          await portfolioService.updateStockPricesFromAPI(user.id);
          await portfolioService.updateAllPricesFromAPI(user.id);
          await loadPortfolioData();
        } catch (error) {
          console.error('Otomatik güncelleme hatası:', error);
        }
      };
      
      updateAllPrices();
      const interval = setInterval(updateAllPrices, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkDepositAutoReturnStatus = () => {
    setDepositAutoReturnActive(depositAutoReturnService.isServiceActive());
  };

  const initializeExchangeRates = async () => {
    try {
      await exchangeRateService.initializeDefaultRates();
    } catch (error) {
      console.error('Error initializing exchange rates:', error);
    }
  };

  const loadPortfolioData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const items = await portfolioService.getPortfolioItems(user.id);
      setPortfolioItems(items);
      
      if (items.length > 0) {
        const aiRecommendations = await portfolioService.generateAIRecommendations(items);
        setRecommendations(aiRecommendations);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    try {
      await portfolioService.updateAllPricesFromAPI(user.id);
      await loadPortfolioData();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Portföy Güncellendi', {
          body: 'Yatırımlarınızın fiyatları güncellendi. Vadeli hesaplar manuel güncellenir.',
          icon: '/icons/icon-192x192.svg'
        });
      }
    } catch (error) {
      console.error('Portföy güncellenirken hata:', error);
    }
  };

  const handleRefreshPrice = async (symbol: string, type: string) => {
    if (!user) return;
    
    try {
      if (type === 'deposit') {
        const depositItems = portfolioItems.filter(item => item.type === 'deposit' && item.symbol === symbol);
        for (const item of depositItems) {
          await portfolioService.addDailyReturnToDeposit(user.id, item.id);
        }
      } else {
        await portfolioService.updateAllPricesFromAPI(user.id);
      }
      await loadPortfolioData();
    } catch (error) {
      console.error('Error refreshing price:', error);
    }
  };

  const handleAddItem = async (item: any) => {
    if (!user) return;
    
    try {
      await portfolioService.addPortfolioItem(user.id, item);
      await loadPortfolioData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding portfolio item:', error);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<PortfolioItem>) => {
    if (!user) return;
    try {
      await portfolioService.updatePortfolioItem(user.id, id, updates);
      await loadPortfolioData();
    } catch (error) {
      console.error('Error updating portfolio item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    try {
      await portfolioService.deletePortfolioItem(user.id, id);
      await loadPortfolioData();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
    }
  };

  const handleShowDetails = (symbol: string) => {
    setSelectedSymbol(symbol);
    setShowDetailsModal(true);
  };

  const handleStartDepositAutoReturn = async () => {
    if (!user) return;
    
    try {
      const depositItems = portfolioItems.filter(item => item.type === 'deposit');
      if (depositItems.length === 0) {
        alert('Vadeli hesap yatırımınız bulunmuyor.');
        return;
      }

      await depositAutoReturnService.startAutoReturnForAllDeposits(user.id, depositItems);
      setDepositAutoReturnActive(true);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Vadeli Hesap Otomatik Getiri', {
          body: `${depositItems.length} vadeli hesap için otomatik günlük getiri hesaplama başlatıldı.`,
          icon: '/icons/icon-192x192.svg'
        });
      }
    } catch (error) {
      console.error('Error starting deposit auto return:', error);
      alert('Otomatik getiri hesaplama başlatılırken bir hata oluştu.');
    }
  };

  const handleStopDepositAutoReturn = () => {
    depositAutoReturnService.stopService();
    setDepositAutoReturnActive(false);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Vadeli Hesap Otomatik Getiri', {
        body: 'Otomatik günlük getiri hesaplama durduruldu.',
        icon: '/icons/icon-192x192.svg'
      });
    }
  };

  const baseFilteredItems = selectedFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.type === selectedFilter);

  const filteredItems = portfolioService.consolidatePortfolioBySymbol(baseFilteredItems)
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </button>
            <div className="flex items-center gap-2">
              <PieChart className="w-7 h-7 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Portföyüm</h1>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600">
            <Plus size={16} />
            Yatırım Ekle
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {portfolioItems.length > 0 ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 mb-6">
              <div className="flex items-center justify-around">
                {[
                  { key: 'investments', label: 'Yatırımlar', icon: PieChart },
                  { key: 'analytics', label: 'Analiz', icon: Brain },
                  { key: 'returns', label: 'Getiri', icon: TrendingUp },
                  { key: 'prices', label: 'Güncelle', icon: RefreshCw }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                      activeTab === key ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'investments' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 mr-2">Filtrele:</span>
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === 'all' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tümü ({portfolioItems.length})
                  </button>
                  {Object.entries(PORTFOLIO_CATEGORIES).map(([key, label]) => {
                    const count = portfolioItems.filter(item => item.type === key).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedFilter(key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedFilter === key ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const sameSymbolCount = baseFilteredItems.filter(i => i.symbol === item.symbol).length;
                    const isConsolidated = sameSymbolCount > 1;
                    return (
                      <PortfolioItemCard key={item.id} item={item} showValues={showValues} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} isConsolidated={isConsolidated} consolidatedCount={sameSymbolCount} onShowDetails={handleShowDetails} onRefreshPrice={handleRefreshPrice} />
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Portföy Analizi</h2>
                  <PortfolioAnalytics portfolioItems={portfolioItems} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <PortfolioChart portfolioItems={portfolioItems} showValues={showValues} />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <AIRecommendationsPanel recommendations={recommendations} loading={loading} />
                </div>
              </div>
            )}

            {activeTab === 'returns' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Getiri Sıralaması</h2>
                <div className="space-y-3">
                  {portfolioService.consolidatePortfolioBySymbol(portfolioItems)
                    .sort((a, b) => b.returnPercentage - a.returnPercentage)
                    .map((item, index) => {
                      const isPositive = item.returnPercentage >= 0;
                      return (
                        <div key={item.symbol} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>{index + 1}</div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.symbol}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{showValues ? `${isPositive ? '+' : ''}%${item.returnPercentage.toFixed(2)}` : '••••'}</p>
                            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{showValues ? `${isPositive ? '+' : ''}${formatCurrency(item.totalReturn)}` : '••••••'}</p>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {activeTab === 'prices' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <PriceUpdatePanel portfolioItems={portfolioItems} onRefresh={handleRefresh} />
                <div className="mt-6 border-t dark:border-gray-700 pt-6">
                    <button onClick={() => setShowDepositSettingsModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-lg font-semibold transition-colors">
                        <Clock size={18} /> Vadeli Hesap Ayarları
                    </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz yatırımınız yok</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">İlk yatırımınızı ekleyerek portföyünüzü oluşturmaya başlayın</p>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
              <Plus className="w-4 h-4" />
              Yatırım Ekle
            </button>
          </div>
        )}
      </main>

      {showAddModal && <AddPortfolioModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddItem} />}
      {showExchangeRateModal && <ExchangeRateModal isOpen={showExchangeRateModal} onClose={() => setShowExchangeRateModal(false)} onUpdate={() => { setShowExchangeRateModal(false); handleRefresh(); }} portfolioItems={portfolioItems} />}
      {showDetailsModal && selectedSymbol && <PortfolioDetailsModal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedSymbol(''); }} symbol={selectedSymbol} items={portfolioItems.filter(item => item.symbol === selectedSymbol)} showValues={showValues} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onRefreshPrice={handleRefreshPrice} />}

      {showDepositSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vadeli Hesap Otomatik Getiri</h2>
              <button onClick={() => setShowDepositSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-medium text-blue-900 dark:text-blue-200">Otomatik Günlük Getiri</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Vadeli hesaplarınız için günlük getiri otomatik olarak hesaplanır ve tutarınıza eklenir.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Durum:</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${depositAutoReturnActive ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {depositAutoReturnActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Etkilenecek Hesap Sayısı:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {portfolioItems.filter(item => item.type === 'deposit').length}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                {depositAutoReturnActive ? (
                  <button onClick={() => { handleStopDepositAutoReturn(); setShowDepositSettingsModal(false); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Durdur
                  </button>
                ) : (
                  <button onClick={() => { handleStartDepositAutoReturn(); setShowDepositSettingsModal(false); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Başlat
                  </button>
                )}
                <button onClick={() => setShowDepositSettingsModal(false)} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};