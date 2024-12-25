import React from 'react';
import { formatCurrency } from '../../utils/currency';

interface MonthlyTrendChartProps {
  data: number[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const maxAmount = Math.max(...data);

  return (
    <div>
      <div className="h-64 flex items-end justify-between gap-2">
        {data.map((amount, i) => {
          const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          return (
            <div
              key={i}
              className="w-full bg-yellow-100 rounded-t-lg relative group"
              style={{ height: `${height}%` }}
            >
              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {formatCurrency(amount.toString())}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        {Array.from({ length: 12 }).map((_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - 11 + i);
          return (
            <span key={i}>
              {date.toLocaleString('tr-TR', { month: 'short' })}
            </span>
          );
        })}
      </div>
    </div>
  );
};