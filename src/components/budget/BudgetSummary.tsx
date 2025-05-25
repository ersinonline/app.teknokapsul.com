import React from 'react';
import { Wallet } from 'lucide-react';
import { Budget } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface BudgetSummaryProps {
  budget: Budget;
  isEditing: boolean;
  onTotalBudgetChange: (value: string) => void;
  monthlyIncome: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  isEditing,
  onTotalBudgetChange,
  monthlyIncome
}) => {
  const totalSpent = Object.values(budget.categories).reduce(
    (total, category) => total + category.spent,
    0
  );

  const remainingBudget = budget.totalBudget - totalSpent;
  const spentPercentage = (totalSpent / budget.totalBudget) * 100 || 0;
  const savingsAmount = monthlyIncome - totalSpent;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
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
            <p className="text-2xl font-semibold">{formatCurrency(budget.totalBudget)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Harcanan</p>
          <p className="text-lg font-medium text-red-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Kalan Bütçe</p>
          <p className="text-lg font-medium">{formatCurrency(remainingBudget)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Net Tasarruf</p>
          <p className={`text-lg font-medium ${savingsAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(savingsAmount)}
          </p>
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