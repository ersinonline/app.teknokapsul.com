import React from 'react';
import { CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface SpendingAnalysisProps {
  categories: Record<CategoryType, number>;
}

export const SpendingAnalysis: React.FC<SpendingAnalysisProps> = ({ categories }) => {
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  const totalSpent = Object.values(categories).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-6">Harcama Analizi</h2>
      <div className="space-y-4">
        {sortedCategories.map(([category, amount]) => {
          const percentage = (amount / totalSpent) * 100;
          return (
            <div key={category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {DEFAULT_CATEGORIES[category as CategoryType]}
                </span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(amount.toString())}
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
  );
};