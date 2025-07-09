import React from 'react';
import { Budget, CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';

interface SpendingPieChartProps {
  categories: Budget['categories'];
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ categories }) => {
  const totalSpent = Object.values(categories).reduce((sum, cat) => sum + cat.spent, 0);
  
  const colors = {
    market: '#FCD34D',
    akaryakit: '#F87171',
    giyim: '#60A5FA',
    yemek: '#34D399',
    ev: '#A78BFA'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl p-6">
      <h2 className="text-lg font-medium mb-4">Harcama Dağılımı</h2>
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {Object.entries(categories).map(([category, data], index) => {
              if (data.spent === 0) return null;
              
              const percentage = (data.spent / totalSpent) * 100;
              const offset = Object.entries(categories)
                .slice(0, index)
                .reduce((sum, [_, catData]) => sum + (catData.spent / totalSpent) * 100, 0);

              return (
                <circle
                  key={category}
                  cx="50"
                  cy="50"
                  r="25"
                  fill="none"
                  stroke={colors[category as keyof typeof colors]}
                  strokeWidth="50"
                  strokeDasharray={`${percentage} 100`}
                  transform={`rotate(${offset * 3.6} 50 50)`}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 w-full">
          {Object.entries(categories).map(([category, data]) => {
            if (data.spent === 0) return null;
            const percentage = ((data.spent / totalSpent) * 100).toFixed(1);

            return (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[category as keyof typeof colors] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {DEFAULT_CATEGORIES[category as CategoryType]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.spent.toFixed(2)} TL ({percentage}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};