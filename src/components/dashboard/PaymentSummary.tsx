import React from 'react';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PaymentSummaryProps {
  totalAmount: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ totalAmount }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md">
      {/* Başlık ve Toplam Borç */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-75">Toplam Borç</p>
          <p className="text-3xl font-semibold mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <CreditCard className="w-8 h-8 opacity-75" />
      </div>

      {/* Alt Bilgi */}
      <div className="mt-4">
        <p className="text-sm opacity-75">Ödenmemiş Borçlar</p>
      </div>
    </div>
  );
};