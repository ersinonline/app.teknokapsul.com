import React from 'react';
import { TrendingDown } from 'lucide-react';
import { Budget } from '../../types/budget';

interface FinancialTipsProps {
  budget: Budget;
}

export const FinancialTips: React.FC<FinancialTipsProps> = ({ budget }) => {
  const totalSpent = Object.values(budget.categories).reduce(
    (sum, cat) => sum + cat.spent,
    0
  );
  const totalBudget = budget.totalBudget;
  const remainingBudget = totalBudget - totalSpent;

  const highestSpendingCategory = Object.entries(budget.categories).reduce(
    (max, [category, data]) => {
      if (!max || data.spent > max.spent) {
        return { category, spent: data.spent };
      }
      return max;
    },
    null as { category: string; spent: number } | null
  );

  return (
    <div className="bg-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl p-6">
      <h2 className="text-lg font-medium mb-4">Harcama Analizi</h2>

      <div className="space-y-4">
        {remainingBudget < 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Bütçe Aşımı</h3>
              <p className="text-sm text-red-600 mt-1">
                Bu ay bütçenizi {Math.abs(remainingBudget).toFixed(2)} TL
                aştınız.
              </p>
            </div>
          </div>
        )}

        {highestSpendingCategory && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <TrendingDown className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800">En Yüksek Harcama</h3>
              <p className="text-sm text-blue-600 mt-1">
                En çok harcamanız {highestSpendingCategory.category}{' '}
                kategorisinde ({highestSpendingCategory.spent.toFixed(2)} TL)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
