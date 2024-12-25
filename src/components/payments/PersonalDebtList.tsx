import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { PersonalDebt } from '../../types/debt';
import { updateDebtStatus } from '../../services/debt.service';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

interface PersonalDebtListProps {
  debts: PersonalDebt[];
  onStatusUpdate: () => void;
}

export const PersonalDebtList: React.FC<PersonalDebtListProps> = ({ debts, onStatusUpdate }) => {
  const handleStatusToggle = async (debtId: string, currentStatus: 'Ödendi' | 'Ödenmedi') => {
    try {
      const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
      await updateDebtStatus(debtId, newStatus);
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating debt status:', error);
    }
  };

  return (
    <div className="space-y-4">
      {debts.map((debt) => (
        <div
          key={debt.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{debt.description}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  debt.status === 'Ödendi'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {debt.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Alacaklı: {debt.creditor}</p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-600">
                  Tutar: <span className="font-medium">{formatCurrency(debt.amount.toString())}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Son Ödeme: <span className="font-medium">{formatDate(debt.dueDate)}</span>
                </p>
              </div>
              {debt.notes && (
                <p className="text-sm text-gray-500 mt-2">{debt.notes}</p>
              )}
            </div>
            <button
              onClick={() => handleStatusToggle(debt.id, debt.status)}
              className={`p-2 rounded-lg transition-colors ${
                debt.status === 'Ödendi'
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={debt.status === 'Ödendi' ? 'Ödenmedi olarak işaretle' : 'Ödendi olarak işaretle'}
            >
              {debt.status === 'Ödendi' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};