import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Target, Calendar, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { portfolioService } from '../../services/portfolio.service';

interface PortfolioAnalyticsProps {
  portfolioItems: any[];
}

interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  returnPercentage: number;
  dayChange: number;
  dayChangePercent: number;
  bestPerformer: any;
  worstPerformer: any;
  diversificationScore: number;
}

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ portfolioItems }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [viewType, setViewType] = useState<'overview' | 'performance' | 'allocation' | 'risk'>('overview');

  // Aynı sembole sahip yatırımları birleştir
  const consolidatedItems = useMemo(() => {
    return portfolioService.consolidatePortfolioBySymbol(portfolioItems);
  }, [portfolioItems]);

  const metrics = useMemo((): PerformanceMetrics => {
    if (!consolidatedItems.length) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalReturn: 0,
        returnPercentage: 0,
        dayChange: 0,
        dayChangePercent: 0,
        bestPerformer: null,
        worstPerformer: null,
        diversificationScore: 0
      };
    }

    const totalValue = consolidatedItems.reduce((sum, item) => {
      if (item.transactionType === 'sell') {
        // Satış işlemi: satış tutarını ekle
        return sum + (item.purchasePrice * Math.abs(item.quantity));
      } else {
        // Normal alış işlemi
        return sum + (item.currentPrice * item.quantity);
      }
    }, 0);
    
    const totalCost = consolidatedItems.reduce((sum, item) => {
      if (item.transactionType === 'sell') {
        // Satış işlemi: mevcut değeri maliyet olarak kullan
        return sum + (item.currentPrice * Math.abs(item.quantity));
      } else {
        // Normal alış işlemi
        return sum + ((item.purchasePrice || item.averagePrice || item.currentPrice) * item.quantity);
      }
    }, 0);
    const totalReturn = totalValue - totalCost;
    const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Calculate real day changes based on actual price movements
    const dayChange = consolidatedItems.reduce((sum, item) => {
      // Use lastUpdated to calculate daily change if available
      const dailyChangeAmount = item.dailyChange || 0;
      
      if (item.transactionType === 'sell') {
        // Satış işlemi için günlük değişim hesaplama
        return sum + (dailyChangeAmount * Math.abs(item.quantity));
      } else {
        // Normal alış işlemi
        return sum + (dailyChangeAmount * item.quantity);
      }
    }, 0);
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // Find best and worst performers
    const itemsWithReturn = consolidatedItems.map(item => {
      // Satış işlemleri için kar/zarar hesaplama
      let currentValue, cost, itemReturn;
      
      if (item.transactionType === 'sell') {
        // Satış işlemi: satış fiyatı - alış fiyatı * miktar
        currentValue = item.purchasePrice * Math.abs(item.quantity); // Satış tutarı
        cost = item.currentPrice * Math.abs(item.quantity); // Mevcut değer (varsayılan alış fiyatı)
        itemReturn = currentValue - cost; // Kar/zarar
      } else {
        // Normal alış işlemi
        currentValue = item.currentPrice * item.quantity;
        cost = (item.purchasePrice || item.averagePrice || item.currentPrice) * item.quantity;
        itemReturn = currentValue - cost;
      }
      
      const itemReturnPercent = cost > 0 ? (itemReturn / cost) * 100 : 0;
      return { ...item, return: itemReturn, returnPercent: itemReturnPercent };
    });

    const bestPerformer = itemsWithReturn.length > 0 ? itemsWithReturn.reduce((best, item) => 
      item.returnPercent > best.returnPercent ? item : best) : null;
    
    const worstPerformer = itemsWithReturn.length > 0 ? itemsWithReturn.reduce((worst, item) => 
      item.returnPercent < worst.returnPercent ? item : worst) : null;

    // Calculate diversification score (simplified)
    const categories = [...new Set(consolidatedItems.map(item => item.category || item.type))];
    const diversificationScore = Math.min(100, (categories.length / 10) * 100);

    return {
      totalValue,
      totalCost,
      totalReturn,
      returnPercentage,
      dayChange,
      dayChangePercent,
      bestPerformer,
      worstPerformer,
      diversificationScore
    };
  }, [portfolioItems]);

  const allocationData = useMemo(() => {
    const categoryAllocation: Record<string, { value: number; count: number; percentage: number }> = {};
    
    consolidatedItems.forEach(item => {
      const value = item.currentPrice * item.quantity;
      const category = item.category || item.type;
      if (!categoryAllocation[category]) {
        categoryAllocation[category] = { value: 0, count: 0, percentage: 0 };
      }
      categoryAllocation[category].value += value;
      categoryAllocation[category].count += 1;
    });

    Object.keys(categoryAllocation).forEach(category => {
      categoryAllocation[category].percentage = metrics.totalValue > 0 
        ? (categoryAllocation[category].value / metrics.totalValue) * 100 
        : 0;
    });

    return categoryAllocation;
  }, [consolidatedItems, metrics.totalValue]);

  const riskMetrics = useMemo(() => {
    // Simplified risk calculations
    const volatility = Math.random() * 30 + 10; // 10-40% volatility
    const sharpeRatio = (metrics.returnPercentage - 5) / volatility; // Assuming 5% risk-free rate
    const maxDrawdown = Math.random() * 20 + 5; // 5-25% max drawdown
    const beta = Math.random() * 1.5 + 0.5; // 0.5-2.0 beta
    
    return {
      volatility,
      sharpeRatio,
      maxDrawdown,
      beta,
      riskLevel: volatility < 15 ? 'Düşük' : volatility < 25 ? 'Orta' : 'Yüksek'
    };
  }, [metrics.returnPercentage]);

  const periodData = useMemo(() => {
    // Simulate historical performance data
    const periods = {
      '1D': { return: metrics.dayChangePercent, label: '1 Gün' },
      '1W': { return: metrics.returnPercentage * 0.1, label: '1 Hafta' },
      '1M': { return: metrics.returnPercentage * 0.3, label: '1 Ay' },
      '3M': { return: metrics.returnPercentage * 0.6, label: '3 Ay' },
      '1Y': { return: metrics.returnPercentage * 0.9, label: '1 Yıl' },
      'ALL': { return: metrics.returnPercentage, label: 'Tümü' }
    };
    return periods;
  }, [metrics]);

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-blue-800">Toplam Değer</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-blue-900">{formatCurrency(metrics.totalValue)}</p>
        </div>
        
        <div className={`rounded-lg p-3 sm:p-4 ${metrics.totalReturn >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {metrics.totalReturn >= 0 ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            )}
            <span className={`text-xs sm:text-sm font-medium ${metrics.totalReturn >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Toplam Getiri
            </span>
          </div>
          <p className={`text-base sm:text-lg font-bold ${metrics.totalReturn >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(metrics.totalReturn)}
          </p>
        </div>
        
        <div className={`rounded-lg p-3 sm:p-4 ${metrics.returnPercentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Percent className={`w-4 h-4 sm:w-5 sm:h-5 ${metrics.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs sm:text-sm font-medium ${metrics.returnPercentage >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Getiri Oranı
            </span>
          </div>
          <p className={`text-base sm:text-lg font-bold ${metrics.returnPercentage >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {metrics.returnPercentage >= 0 ? '+' : ''}{metrics.returnPercentage.toFixed(2)}%
          </p>
        </div>
        
        <div className={`rounded-lg p-3 sm:p-4 ${metrics.dayChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${metrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs sm:text-sm font-medium ${metrics.dayChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Günlük Değişim
            </span>
          </div>
          <p className={`text-base sm:text-lg font-bold ${metrics.dayChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {metrics.dayChange >= 0 ? '+' : ''}{formatCurrency(metrics.dayChange)}
          </p>
        </div>
      </div>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {metrics.bestPerformer && (
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2 sm:mb-3">En İyi Performans</h3>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-green-800 truncate">{metrics.bestPerformer.symbol}</p>
                <p className="text-xs sm:text-sm text-green-600 truncate">{metrics.bestPerformer.name}</p>
              </div>
              <div className="text-right ml-2">
                <p className="font-bold text-green-900 text-sm sm:text-base">+{metrics.bestPerformer.returnPercent.toFixed(2)}%</p>
                <p className="text-xs sm:text-sm text-green-600">+{formatCurrency(metrics.bestPerformer.return)}</p>
              </div>
            </div>
          </div>
        )}
        
        {metrics.worstPerformer && (
          <div className="bg-red-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2 sm:mb-3">En Kötü Performans</h3>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-red-800 truncate">{metrics.worstPerformer.symbol}</p>
                <p className="text-xs sm:text-sm text-red-600 truncate">{metrics.worstPerformer.name}</p>
              </div>
              <div className="text-right ml-2">
                <p className="font-bold text-red-900 text-sm sm:text-base">{metrics.worstPerformer.returnPercent.toFixed(2)}%</p>
                <p className="text-xs sm:text-sm text-red-600">{formatCurrency(metrics.worstPerformer.return)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {Object.entries(periodData).map(([period, data]) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period as any)}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {data.label}
          </button>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-8 text-center">
        <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-gray-600 mb-2">Performans Grafiği</p>
        <p className="text-xs sm:text-sm text-gray-500">
          {periodData[selectedPeriod].label} döneminde: 
          <span className={`font-medium ml-1 ${
            periodData[selectedPeriod].return >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {periodData[selectedPeriod].return >= 0 ? '+' : ''}{periodData[selectedPeriod].return.toFixed(2)}%
          </span>
        </p>
      </div>
    </div>
  );

  const renderAllocation = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Allocation Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-8 text-center">
        <PieChart className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-gray-600 mb-2">Portföy Dağılımı</p>
        <p className="text-xs sm:text-sm text-gray-500">Kategori bazında yatırım dağılımı</p>
      </div>

      {/* Allocation Details */}
      <div className="space-y-2 sm:space-y-3">
        {Object.entries(allocationData).map(([category, data]) => (
          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{category}</p>
              <p className="text-xs sm:text-sm text-gray-600">{data.count} yatırım</p>
            </div>
            <div className="text-right ml-2">
              <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(data.value)}</p>
              <p className="text-xs sm:text-sm text-gray-600">{data.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Diversification Score */}
      <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="text-xs sm:text-sm font-medium text-blue-800">Çeşitlendirme Skoru</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.diversificationScore}%` }}
            />
          </div>
          <span className="text-base sm:text-lg font-bold text-blue-900">{metrics.diversificationScore.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-1">Volatilite</p>
          <p className="text-base sm:text-lg font-bold text-yellow-900">{riskMetrics.volatility.toFixed(1)}%</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-1">Sharpe Oranı</p>
              <p className="text-base sm:text-lg font-bold text-yellow-900">{riskMetrics.sharpeRatio.toFixed(2)}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-orange-800 mb-1">Max Düşüş</p>
          <p className="text-base sm:text-lg font-bold text-orange-900">-{riskMetrics.maxDrawdown.toFixed(1)}%</p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-1">Beta</p>
          <p className="text-base sm:text-lg font-bold text-indigo-900">{riskMetrics.beta.toFixed(2)}</p>
        </div>
      </div>

      {/* Risk Level */}
      <div className={`rounded-lg p-3 sm:p-4 ${
        riskMetrics.riskLevel === 'Düşük' ? 'bg-green-50' :
        riskMetrics.riskLevel === 'Orta' ? 'bg-yellow-50' : 'bg-red-50'
      }`}>
        <h3 className={`text-base sm:text-lg font-semibold mb-2 ${
          riskMetrics.riskLevel === 'Düşük' ? 'text-green-900' :
          riskMetrics.riskLevel === 'Orta' ? 'text-yellow-900' : 'text-red-900'
        }`}>
          Risk Seviyesi: {riskMetrics.riskLevel}
        </h3>
        <p className={`text-xs sm:text-sm ${
          riskMetrics.riskLevel === 'Düşük' ? 'text-green-700' :
          riskMetrics.riskLevel === 'Orta' ? 'text-yellow-700' : 'text-red-700'
        }`}>
          {riskMetrics.riskLevel === 'Düşük' && 'Portföyünüz düşük risk seviyesinde. Stabil getiri beklentisi var.'}
          {riskMetrics.riskLevel === 'Orta' && 'Portföyünüz orta risk seviyesinde. Dengeli bir yaklaşım sergiliyor.'}
          {riskMetrics.riskLevel === 'Yüksek' && 'Portföyünüz yüksek risk seviyesinde. Dikkatli olun ve çeşitlendirmeyi artırın.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {[
            { key: 'overview', label: 'Genel', icon: TrendingUp },
            { key: 'performance', label: 'Performans', icon: BarChart3 },
            { key: 'allocation', label: 'Dağılım', icon: PieChart },
            { key: 'risk', label: 'Risk', icon: Target }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewType(key as any)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                viewType === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {viewType === 'overview' && renderOverview()}
      {viewType === 'performance' && renderPerformance()}
      {viewType === 'allocation' && renderAllocation()}
      {viewType === 'risk' && renderRisk()}

      {consolidatedItems.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <p className="text-sm sm:text-base">Analiz için portföyünüze yatırım ekleyin.</p>
        </div>
      )}
    </div>
  );
};