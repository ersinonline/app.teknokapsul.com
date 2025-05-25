import React from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
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
      <h2 className="text-lg font-medium mb-6">Ödeme İstatistikleri</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ödenen Toplam</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(paidAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};