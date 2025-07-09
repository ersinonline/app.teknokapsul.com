import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, Brain, Eye, EyeOff, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioService } from '../../services/portfolio.service';
import { PortfolioItem, PortfolioSummary, AIRecommendation, PORTFOLIO_CATEGORIES } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AddPortfolioModal } from '../../components/portfolio/AddPortfolioModal';
import { PortfolioItemCard } from '../../components/portfolio/PortfolioItemCard';
import { AIRecommendationsPanel } from '../../components/portfolio/AIRecommendationsPanel';
import { PortfolioChart } from '../../components/portfolio/PortfolioChart';
import { ExchangeRateModal } from '../../components/portfolio/ExchangeRateModal';
import { exchangeRateService } from '../../services/exchange-rate.service';

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      initializeExchangeRates();
      loadPortfolioData();
    }
  }, [user]);

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
      const items = await portfolioService.getPortfolioItems(user.uid);
      setPortfolioItems(items);
      
      const portfolioSummary = portfolioService.calculatePortfolioSummary(items);
      setSummary(portfolioSummary);
      
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
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

  const handleAddItem = async (item: any) => {
    if (!user) return;
    
    try {
      await portfolioService.addPortfolioItem(user.uid, item);
      await loadPortfolioData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding portfolio item:', error);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      await portfolioService.updatePortfolioItem(id, updates);
      await loadPortfolioData();
    } catch (error) {
      console.error('Error updating portfolio item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await portfolioService.deletePortfolioItem(id);
      await loadPortfolioData();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
    }
  };

  const filteredItems = (selectedFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.type === selectedFilter))
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()); // En yeni tarih en üstte

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
              onClick={() => setShowExchangeRateModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Fiyat Güncelle</span>
              <span className="text-xs sm:hidden">Güncelle</span>
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

      {/* Portfolio Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Toplam Değer</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {showValues ? formatCurrency(summary.totalValue) : '••••••'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Toplam Getiri</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  summary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showValues ? formatCurrency(summary.totalReturn) : '••••••'}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                summary.totalReturn >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {summary.totalReturn >= 0 ? (
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Getiri Oranı</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  summary.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showValues ? `%${summary.returnPercentage.toFixed(2)}` : '••••'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Yatırım Sayısı</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{portfolioItems.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Statistics */}
      {summary && summary.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Kategori İstatistikleri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {summary.categoryBreakdown.map((category) => (
              <div key={category.category} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">{category.category}</h3>
                  <span className="text-xs sm:text-sm text-gray-600">{category.count} adet</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-primary">
                  {showValues ? formatCurrency(category.value) : '••••••'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  %{((category.value / summary.totalValue) * 100).toFixed(1)} oranında
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Chart */}
      {portfolioItems.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Portföy Dağılımı</h2>
          <PortfolioChart portfolioItems={portfolioItems} showValues={showValues} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Portfolio Items */}
        <div className="lg:col-span-2">
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
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  showValues={showValues}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              ))}
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
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-1">
          <AIRecommendationsPanel 
            recommendations={recommendations}
            loading={loading}
          />
        </div>
      </div>

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
    </div>
  );
};