import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Budget } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface BudgetAnalyticsProps {
  budget: Budget;
  monthlyIncome: number;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({ budget, monthlyIncome }) => {
  const totalSpent = Object.values(budget.categories).reduce(
    (sum, cat) => sum + cat.spent,
    0
  );

  const savingsAmount = monthlyIncome - totalSpent;
  const savingsPercentage = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;

  // Kategorileri harcama miktarına göre sırala
  const sortedCategories = Object.entries(budget.categories)
    .sort(([, a], [, b]) => b.spent - a.spent)
    .filter(([, data]) => data.spent > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-6">Bütçe Analizi</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gelir-Gider Durumu */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Gelir-Gider Durumu</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Gelir:</span>
              <span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gider:</span>
              <span className="font-medium text-red-600">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Kalan:</span>
                <span className={`font-medium ${savingsAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(savingsAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasarruf Durumu */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Tasarruf Durumu</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {savingsAmount >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-gray-600">
                Gelirinizin %{Math.abs(savingsPercentage).toFixed(1)}'i
                {savingsAmount >= 0 ? ' tasarruf' : ' açık'} var
              </span>
            </div>
          </div>
        </div>

        {/* Bütçe Uyarıları */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Bütçe Uyarıları</h3>
          <div className="space-y-2">
            {monthlyIncome === 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Gelir bilgisi girilmemiş</span>
              </div>
            )}
            {savingsAmount < 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Giderler geliri aşıyor</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* En Çok Harcama Yapılan Kategoriler */}
      <div className="mt-6">
        <h3 className="font-medium mb-4">En Çok Harcama Yapılan Kategoriler</h3>
        <div className="space-y-4">
          {sortedCategories.map(([category, data]) => {
            const percentage = (data.spent / totalSpent) * 100;
            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(data.spent)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};