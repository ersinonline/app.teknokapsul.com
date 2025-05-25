import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PaymentStatsProps {
  pendingAmount: number;
  paidAmount: number;
}

export const PaymentStats: React.FC<PaymentStatsProps> = ({
  pendingAmount,
  paidAmount,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-full">
      <h2 className="text-lg font-medium mb-4">Ödeme İstatistikleri</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Bekleyen Ödemeler</span>
          </div>
          <span className="font-medium">{formatCurrency(pendingAmount.toString())}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Ödenen Toplam</span>
          </div>
          <span className="font-medium">{formatCurrency(paidAmount.toString())}</span>
        </div>
      </div>
    </div>
  );
};