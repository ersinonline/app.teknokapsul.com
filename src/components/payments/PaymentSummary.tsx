import React from 'react';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PaymentSummaryProps {
  totalAmount: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ totalAmount }) => {
  const isDebtCleared = totalAmount <= 0;

  return (
    <div
      className={`rounded-xl p-6 text-white h-full ${
        isDebtCleared
          ? 'bg-gradient-to-r from-green-500 to-green-600'
          : 'bg-gradient-to-r from-blue-500 to-blue-600'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-75">Toplam Borç</p>
          <p className="text-3xl font-semibold mt-1">
            {isDebtCleared ? 'Borç Yok' : formatCurrency(totalAmount)}
          </p>
        </div>
        <CreditCard className="w-8 h-8 opacity-75" aria-label="Borç özeti" />
      </div>
      <div className="mt-4">
        <p className="text-sm opacity-75">
          {isDebtCleared ? 'Tüm borçlar ödendi!' : 'Ödenmesi gereken borçlar mevcut.'}
        </p>
      </div>
    </div>
  );
};