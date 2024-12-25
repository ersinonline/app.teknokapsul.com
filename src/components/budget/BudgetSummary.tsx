import React from 'react';
import { Wallet } from 'lucide-react';
import { Budget } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface BudgetSummaryProps {
  budget: Budget;
  isEditing: boolean;
  onTotalBudgetChange: (value: string) => void;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  isEditing,
  onTotalBudgetChange,
}) => {
  const totalSpent = Object.values(budget.categories).reduce(
    (total, category) => total + category.spent,
    0
  );

  const remainingBudget = budget.totalBudget - totalSpent;
  const spentPercentage = (totalSpent / budget.totalBudget) * 100 || 0;

  return (
    <div className="bg-white rounded-xl shadow-lg dark:shadow-2xl dark:shadow-black/10 transition-all duration-200 hover:shadow-xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-yellow-100 rounded-lg">
          <Wallet className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Toplam Bütçe</h2>
          {isEditing ? (
            <input
              type="number"
              value={budget.totalBudget}
              onChange={(e) => onTotalBudgetChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          ) : (
            <p className="text-2xl font-semibold">{formatCurrency(budget.totalBudget.toString())}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Harcanan</p>
          <p className="text-lg font-medium">{formatCurrency(totalSpent.toString())}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Kalan</p>
          <p className="text-lg font-medium">{formatCurrency(remainingBudget.toString())}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Bütçe Kullanımı</span>
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
    </div>
  );
};