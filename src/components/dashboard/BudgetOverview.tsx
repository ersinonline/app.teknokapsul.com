import React from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/currency';
import { DEFAULT_CATEGORIES, CategoryType } from '../../types/budget';

export const BudgetOverview = () => {
  const { budget } = useBudget();

  if (!budget) return null;

  const totalBudget = budget.totalBudget;
  const totalSpent = Object.values(budget.categories).reduce(
    (sum, cat) => sum + (cat.spent || 0),
    0
  );
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate total monthly paid and unpaid amounts
  const totalMonthlyPaid = Object.values(budget.categories).reduce(
    (sum, cat) => sum + (cat.paidAmount || 0),
    0
  );
  const totalMonthlyUnpaid = Object.values(budget.categories).reduce(
    (sum, cat) => sum + (cat.unpaidAmount || 0),
    0
  );

  // En çok harcama yapılan kategoriyi bul
  const topSpendingCategory = Object.entries(budget.categories)
    .sort(([, a], [, b]) => (b.spent || 0) - (a.spent || 0))[0];

  // Bütçe aşımı olan kategorileri bul
  const overBudgetCategories = Object.entries(budget.categories)
    .filter(([, data]) => (data.spent || 0) > (data.limit || 0))
    .map(([category]) => DEFAULT_CATEGORIES[category as CategoryType]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Bütçe Durumu ve Aylık Borç İstatistikleri</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Wallet className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Kalan Bütçe</p>
            <p className="text-lg font-semibold">{formatCurrency(remainingBudget)}</p>
          </div>
        </div>

        {topSpendingCategory && topSpendingCategory[0] && DEFAULT_CATEGORIES[topSpendingCategory[0] as CategoryType] && (
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Çok Harcama</p>
              <p className="text-lg font-semibold">
                {DEFAULT_CATEGORIES[topSpendingCategory[0] as CategoryType]}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bu Ay Ödenen</p>
            <p className="text-lg font-semibold">{formatCurrency(totalMonthlyPaid)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bu Ay Ödenmeyen</p>
            <p className="text-lg font-semibold">{formatCurrency(totalMonthlyUnpaid)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Toplam Bütçe Kullanımı</span>
            <span>{Math.round(spentPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                spentPercentage > 90 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {overBudgetCategories.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg mt-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Bütçe Aşımı Uyarısı</p>
              <p className="text-sm text-red-600 mt-1">
                {overBudgetCategories.join(', ')} kategorilerinde bütçe aşımı var.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};