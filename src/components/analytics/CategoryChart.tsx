import React from 'react';
import { CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface CategoryChartProps {
  categories: Record<CategoryType, number>;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ categories }) => {
  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([category, amount]) => (
        <div key={category} className="flex items-center justify-between">
          <span className="text-gray-600">{DEFAULT_CATEGORIES[category as CategoryType]}</span>
          <span className="font-medium">{formatCurrency(amount.toString())}</span>
        </div>
      ))}
    </div>
  );
};