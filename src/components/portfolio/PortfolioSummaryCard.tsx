import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, Calendar } from 'lucide-react';
import { PortfolioSummary } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
  showValues: boolean;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({
  summary,
  showValues
}) => {
  const isPositive = summary.totalReturn >= 0;
  const lastUpdated = new Date(summary.lastUpdated).toLocaleString('tr-TR');

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 10) return 'text-green-600';
    if (percentage >= 0) return 'text-green-500';
    if (percentage >= -5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPerformanceIcon = (percentage: number) => {
    return percentage >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Portföy Özeti</h2>
            <p className="text-sm text-gray-600">Toplam {summary.totalItems} yatırım</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Son güncelleme</span>
          </div>
          <p className="text-xs text-gray-600">{lastUpdated}</p>
        </div>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Toplam Değer */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Toplam Değer</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {showValues ? formatCurrency(summary.totalValue) : '••••••••'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Yatırım: {showValues ? formatCurrency(summary.totalInvestment) : '••••••'}
          </p>
        </div>

        {/* Toplam Getiri */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            {React.createElement(getPerformanceIcon(summary.returnPercentage), {
              className: `w-5 h-5 ${getPerformanceColor(summary.returnPercentage)}`
            })}
            <span className="text-sm font-medium text-gray-600">Toplam Getiri</span>
          </div>
          <p className={`text-2xl font-bold ${getPerformanceColor(summary.returnPercentage)}`}>
            {showValues ? (
              <>
                {isPositive ? '+' : ''}{formatCurrency(summary.totalReturn)}
              </>
            ) : (
              '••••••••'
            )}
          </p>
          <p className={`text-sm mt-1 ${getPerformanceColor(summary.returnPercentage)}`}>
            {showValues ? `%${summary.returnPercentage.toFixed(2)}` : '••••'}
          </p>
        </div>

        {/* En İyi Performans */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">En İyi Performans</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {summary.bestPerformer?.name || 'Henüz yok'}
          </p>
          {summary.bestPerformer && (
            <p className="text-sm text-green-600 mt-1">
              {showValues ? `+%${summary.bestPerformer.returnPercentage.toFixed(2)}` : '••••'}
            </p>
          )}
        </div>
      </div>

      {/* Kategori Dağılımı */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Kategori Dağılımı</h3>
        <div className="space-y-3">
          {summary.categoryBreakdown.map((category) => {
            const percentage = (category.value / summary.totalValue) * 100;
            return (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-700">{category.category}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {showValues ? formatCurrency(category.value) : '••••••'}
                  </p>
                  <p className="text-xs text-gray-600">
                    %{percentage.toFixed(1)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performans Çubuğu */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Genel Performans</span>
          <span>
            {showValues ? `%${summary.returnPercentage.toFixed(2)}` : '••••'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min(Math.abs(summary.returnPercentage), 100)}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>-100%</span>
          <span>0%</span>
          <span>+100%</span>
        </div>
      </div>
    </div>
  );
};