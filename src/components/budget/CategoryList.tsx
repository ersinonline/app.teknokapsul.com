import React from 'react';
import { Budget, CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface CategoryListProps {
  budget: Budget;
  isEditing: boolean;
  onCategoryChange: (category: CategoryType, value: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  budget,
  isEditing,
  onCategoryChange,
}) => {
  const calculatePercentage = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg dark:shadow-2xl dark:shadow-black/10 transition-all duration-200 hover:shadow-xl p-6">
      <h2 className="text-lg font-medium mb-6">Kategori Bazlı Bütçeler</h2>
      <div className="space-y-6">
        {Object.entries(budget.categories).map(([category, data]) => (
          <div key={category}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{DEFAULT_CATEGORIES[category as CategoryType]}</span>
              <div className="text-sm">
                {isEditing ? (
                  <input
                    type="number"
                    value={data.limit}
                    onChange={(e) => onCategoryChange(category as CategoryType, e.target.value)}
                    className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                ) : (
                  <span>{formatCurrency(data.limit.toString())}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Harcanan: {formatCurrency(data.spent.toString())}</span>
              <span>{calculatePercentage(data.spent, data.limit)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  calculatePercentage(data.spent, data.limit) > 90
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
                style={{
                  width: `${calculatePercentage(data.spent, data.limit)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};