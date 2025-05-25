import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface IncomeTrackerProps {
  monthlyIncome: number;
  onIncomeChange: (value: number) => void;
  isEditing: boolean;
}

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  monthlyIncome,
  onIncomeChange,
  isEditing
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-green-100 rounded-lg">
          <Wallet className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-lg font-medium">Aylık Gelir</h2>
      </div>

      {isEditing ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aylık Net Gelir
          </label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => onIncomeChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-semibold text-green-600">
            {formatCurrency(monthlyIncome)}
          </p>
          <p className="text-sm text-gray-600 mt-2">Net Gelir</p>
        </div>
      )}
    </div>
  );
};