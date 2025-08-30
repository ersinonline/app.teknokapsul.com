import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, Brain, Eye, EyeOff, RefreshCw, PieChart, Clock, X } from 'lucide-react';
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

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'analytics' | 'investments' | 'returns' | 'prices'>('analytics');

  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [showValues, setShowValues] = useState(true);
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
      
      // Otomatik güncelleme - sayfa yüklendiğinde ve her 5 dakikada bir
      const updateAllPrices = async () => {
        try {
          await portfolioService.updateStockPricesFromAPI(user.id);
          await portfolioService.updateAllPricesFromAPI(user.id);
          await loadPortfolioData();
        } catch (error) {
          console.error('Otomatik güncelleme hatası:', error);
        }
      };
      
      // İlk güncelleme
      updateAllPrices();
      
      // 5 dakikada bir otomatik güncelleme
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
    
    setRefreshing(true);
    try {
      // Tüm fiyatları güncelle (hisse, döviz, altın) - vadeli hesaplar hariç
      await portfolioService.updateAllPricesFromAPI(user.id);
      // Portföy verilerini yeniden yükle
      await loadPortfolioData();
      
      // Bildirim gönder
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Portföy Güncellendi', {
          body: 'Yatırımlarınızın fiyatları güncellendi. Vadeli hesaplar manuel güncellenir.',
          icon: '/icons/icon-192x192.svg'
        });
      }
    } catch (error) {
      console.error('Portföy güncellenirken hata:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshPrice = async (symbol: string, type: string) => {
    if (!user) return;
    
    try {
      if (type === 'deposit') {
        // Vadeli hesap için günlük getiri hesapla ve ekle
        const depositItems = portfolioItems.filter(item => item.type === 'deposit' && item.symbol === symbol);
        for (const item of depositItems) {
          await portfolioService.addDailyReturnToDeposit(user.id, item.id);
        }
        await loadPortfolioData();
      } else {
        // Diğer yatırım türleri için normal fiyat güncelleme
        await portfolioService.updateStockPricesFromAPI(user.id);
        await portfolioService.updateAllPricesFromAPI(user.id);
        await loadPortfolioData();
      }
    } catch (error) {
      console.error('Error refreshing price:', error);
    }
  };

  const handleAddItem = async (item: any) => {
    if (!user) return;
    
    try {
      await portfolioService.addPortfolioItem(user.id, item);
      
      // Vadeli hesap eklendi bildirimi (otomatik getiri başlatılmadan)
      if (item.type === 'deposit') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Vadeli Hesap Eklendi', {
            body: 'Vadeli hesabınız başarıyla eklendi. Manuel güncelleme yapabilirsiniz.',
            icon: '/icons/icon-192x192.svg'
          });
        }
      }
      
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
      
      // Bildirim gönder
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
    
    // Bildirim gönder
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

  // Aynı sembole sahip yatırımları birleştir
  const filteredItems = portfolioService.consolidatePortfolioBySymbol(baseFilteredItems)
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Portföyüm</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Yatırımlarınızı takip edin ve AI destekli öneriler alın</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowValues(!showValues)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-xs sm:text-sm">{showValues ? 'Gizle' : 'Göster'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm">Yenile</span>
            </button>
            

            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Yatırım Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
       <div className="grid grid-cols-4 gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
         {[
           { key: 'analytics', label: 'Analiz & Grafikler', mobileLabel: 'Analiz', icon: Brain },
           { key: 'investments', label: 'Yatırımlar', mobileLabel: 'Yatırımlar', icon: PieChart },
           { key: 'returns', label: 'Getiri Sırası', mobileLabel: 'Getiri', icon: TrendingUp },
           { key: 'prices', label: 'Fiyat Güncelle', mobileLabel: 'Güncelle', icon: RefreshCw }
         ].map(({ key, label, mobileLabel, icon: Icon }) => (
           <button
             key={key}
             onClick={() => setActiveTab(key as any)}
             className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
               activeTab === key
                 ? 'bg-white text-primary shadow-sm'
                 : 'text-gray-600 hover:text-gray-900'
             }`}
           >
             <Icon className="w-4 h-4" />
             <span className="text-center leading-tight block sm:hidden">{mobileLabel}</span>
             <span className="text-center leading-tight hidden sm:block">{label}</span>
           </button>
         ))}
       </div>

      {/* Tab Content */}
      {activeTab === 'investments' && (
        <>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
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
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    selectedFilter === key
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Portfolio Items List */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const sameSymbolCount = baseFilteredItems.filter(i => i.symbol === item.symbol).length;
                const isConsolidated = sameSymbolCount > 1;
                
                return (
                  <PortfolioItemCard
                    key={item.id}
                    item={item}
                    showValues={showValues}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    isConsolidated={isConsolidated}
                    consolidatedCount={sameSymbolCount}
                    onShowDetails={handleShowDetails}
                    onRefreshPrice={handleRefreshPrice}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedFilter === 'all' ? 'Henüz yatırımınız yok' : 'Bu kategoride yatırım bulunamadı'}
              </h3>
              <p className="text-gray-600 mb-6">
                İlk yatırımınızı ekleyerek portföyünüzü oluşturmaya başlayın
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yatırım Ekle
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {portfolioItems.length > 0 ? (
            <>
              {/* Portfolio Analytics */}
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Portföy Analizi</h2>
                <PortfolioAnalytics 
                  portfolioItems={portfolioItems}
                />
              </div>
              
              {/* Portfolio Chart */}
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
                <PortfolioChart portfolioItems={portfolioItems} showValues={showValues} />
              </div>
              
              {/* AI Recommendations */}
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
                <AIRecommendationsPanel 
                  recommendations={recommendations}
                  loading={loading}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz yatırımınız yok</h3>
              <p className="text-gray-600 mb-6">Analiz ve grafikleri görüntülemek için ilk yatırımınızı ekleyin</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yatırım Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Getiri Sıralaması</h2>
          {portfolioItems.length > 0 ? (
            <div className="space-y-3">
              {portfolioService.consolidatePortfolioBySymbol(portfolioItems)
                .sort((a, b) => b.returnPercentage - a.returnPercentage)
                .map((item, index) => {
                  const isPositive = item.returnPercentage >= 0;
                  
                  return (
                    <div key={item.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          {item.type === 'fund' ? (
                            <a 
                              href={`https://fintables.com/fonlar/${item.symbol}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            >
                              {item.symbol}
                            </a>
                          ) : (
                            <h3 className="font-medium text-gray-900">{item.symbol}</h3>
                          )}
                          <p className="text-sm text-gray-600">{item.name}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-bold ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {showValues ? `${isPositive ? '+' : ''}%${item.returnPercentage.toFixed(2)}` : '••••'}
                        </p>
                        <p className={`text-sm ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {showValues ? `${isPositive ? '+' : ''}${formatCurrency(item.totalReturn)}` : '••••••'}
                        </p>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz yatırımınız bulunmuyor</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="space-y-6">
          {/* Fiyat Güncellemeleri */}
          <PriceUpdatePanel 
            portfolioItems={portfolioItems}
            onRefresh={handleRefresh}
          />
        </div>
      )}

      {/* Add Portfolio Modal */}
      {showAddModal && (
        <AddPortfolioModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {/* Exchange Rate Modal */}
      {showExchangeRateModal && (
        <ExchangeRateModal
          isOpen={showExchangeRateModal}
          onClose={() => setShowExchangeRateModal(false)}
          onUpdate={() => {
            setShowExchangeRateModal(false);
            handleRefresh();
          }}
          portfolioItems={portfolioItems}
        />
      )}

      {/* Portfolio Details Modal */}
      {showDetailsModal && selectedSymbol && (
        <PortfolioDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSymbol('');
          }}
          symbol={selectedSymbol}
          items={portfolioItems.filter(item => item.symbol === selectedSymbol)}
          showValues={showValues}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onRefreshPrice={handleRefreshPrice}
        />
      )}

      {/* Deposit Auto Return Settings Modal */}
      {showDepositSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Vadeli Hesap Otomatik Getiri</h2>
              <button
                onClick={() => setShowDepositSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Otomatik Günlük Getiri</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Vadeli hesaplarınız için günlük getiri otomatik olarak hesaplanır ve tutarınıza eklenir.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Durum:</span>
                  <span className={`text-sm font-medium ${
                    depositAutoReturnActive ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {depositAutoReturnActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Vadeli Hesap Sayısı:</span>
                  <span className="text-sm text-gray-600">
                    {portfolioItems.filter(item => item.type === 'deposit').length}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                {depositAutoReturnActive ? (
                  <button
                    onClick={() => {
                      handleStopDepositAutoReturn();
                      setShowDepositSettingsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Durdur
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleStartDepositAutoReturn();
                      setShowDepositSettingsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Başlat
                  </button>
                )}
                
                <button
                  onClick={() => setShowDepositSettingsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
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