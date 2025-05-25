import React from 'react';
import { CreditCard, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PaymentSummaryProps {
  totalAmount: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ totalAmount }) => {
  const isDebtCleared = totalAmount <= 0;

  return (
    <div className={`rounded-xl p-6 text-white h-full ${
      isDebtCleared
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
        : 'bg-gradient-to-br from-blue-500 to-blue-600'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-75">Toplam Borç</p>
          <p className="text-3xl font-semibold mt-1">
            {isDebtCleared ? 'Borç Yok' : formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-xl">
          {isDebtCleared ? (
            <TrendingUp className="w-8 h-8 opacity-90" />
          ) : (
            <TrendingDown className="w-8 h-8 opacity-90" />
          )}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm opacity-75">
          {isDebtCleared 
            ? 'Tebrikler! Tüm borçlarınız ödenmiş durumda.'
            : 'Ödenmesi gereken borçlarınız mevcut.'}
        </p>
      </div>
    </div>
  );
};