import React from 'react';
import { TrendingUp, PieChart, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';

interface StatCardsProps {
  analytics: {
    totalSpent: number;
    totalDebt: number;
    budgetCompliance: number;
    topCategory: [string, number] | undefined;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ analytics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bu Ay Toplam Harcama</p>
            <p className="text-xl font-semibold">{formatCurrency(analytics.totalSpent.toString())}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bu Ay Toplam Borç</p>
            <p className="text-xl font-semibold">{formatCurrency(analytics.totalDebt.toString())}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">En Çok Harcama</p>
            <p className="text-xl font-semibold">
              {analytics.topCategory ? DEFAULT_CATEGORIES[analytics.topCategory[0] as CategoryType] : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Target className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bütçe Uyumluluğu</p>
            <p className="text-xl font-semibold text-green-600">%{analytics.budgetCompliance}</p>
          </div>
        </div>
      </div>
    </div>
  );
};