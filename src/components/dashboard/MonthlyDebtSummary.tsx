import React, { useMemo } from 'react';
import { Payment } from '../../types/data';
import { CreditCard } from 'lucide-react';
import { getCurrentMonthTotal, getMonthName } from '../../utils/payments';

interface MonthlyDebtSummaryProps {
  payments: Payment[];
}

export const MonthlyDebtSummary: React.FC<MonthlyDebtSummaryProps> = ({ payments }) => {
  // Ay ve yıl bilgilerini alırken tekrar hesaplama yapılmasını önlemek için `useMemo` kullandık.
  const { currentMonth, currentYear, monthlyTotal } = useMemo(() => {
    const date = new Date();
    return {
      currentMonth: date.getMonth(),
      currentYear: date.getFullYear(),
      monthlyTotal: getCurrentMonthTotal(payments),
    };
  }, [payments]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Bu Ayki Borç Özeti</h2>
        <CreditCard className="w-6 h-6 text-gray-400" />
      </div>

      {/* Toplam Borç */}
      <div className="text-3xl font-bold text-yellow-600 mb-2">
        {monthlyTotal.toFixed(2)} TL
      </div>

      {/* Ay ve Yıl Açıklaması */}
      <p className="text-gray-600">
        {`${getMonthName(currentMonth)} ${currentYear}`} ayı toplam borç tutarı
      </p>
    </div>
  );
};