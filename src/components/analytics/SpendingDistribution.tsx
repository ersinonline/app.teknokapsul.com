import React from 'react';
import { CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface SpendingDistributionProps {
  categories: Record<CategoryType, number>;
}

export const SpendingDistribution: React.FC<SpendingDistributionProps> = ({ categories }) => {
  const totalAmount = Object.values(categories).reduce((a, b) => a + b, 0);
  
  const categoryColors = {
    market: '#FCD34D',
    akaryakit: '#F87171',
    giyim: '#60A5FA',
    yemek: '#34D399',
    ev: '#A78BFA'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-6">Harcama Dağılımı</h2>
      <div className="flex justify-center mb-6">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {Object.entries(categories).map(([category, amount], index) => {
              if (amount === 0) return null;
              const percentage = (amount / totalAmount) * 100;
              const offset = Object.entries(categories)
                .slice(0, index)
                .reduce((sum, [_, val]) => sum + (val / totalAmount) * 100, 0);

              return (
                <circle
                  key={category}
                  cx="50"
                  cy="50"
                  r="25"
                  fill="none"
                  stroke={categoryColors[category as keyof typeof categoryColors]}
                  strokeWidth="50"
                  strokeDasharray={`${percentage} 100`}
                  transform={`rotate(${offset * 3.6} 50 50)`}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(categories).map(([category, amount]) => (
          <div key={category} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {DEFAULT_CATEGORIES[category as CategoryType]}
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(amount.toString())}
                {totalAmount > 0 && ` (${((amount / totalAmount) * 100).toFixed(1)}%)`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};