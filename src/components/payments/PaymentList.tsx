import React, { useState, useEffect, useMemo } from 'react';
import { Payment } from '../../types/data';
import { PaymentGroup as PaymentGroupComponent } from './PaymentGroup';
import { groupPaymentsByMonth, PaymentGroup } from '../../utils/payments';

interface PaymentListProps {
  payments: Payment[];
  onPaymentDelete?: () => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, onPaymentDelete }) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  
  // Memoize groups to prevent unnecessary recalculations
  const groups = useMemo(() => groupPaymentsByMonth(payments), [payments]);

  // İlk yüklemede, ödenmemiş ödemesi olan ilk grubu aç
  useEffect(() => {
    if (groups.length > 0) {
      const firstUnpaidGroup = groups.find(group => group.totalAmount > group.paidAmount);
      if (firstUnpaidGroup) {
        setExpandedGroupId(`${firstUnpaidGroup.month}-${firstUnpaidGroup.year}`);
      } else {
        setExpandedGroupId(`${groups[0].month}-${groups[0].year}`);
      }
    }
  }, [groups]);

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Bu tarih aralığında borç bulunmamaktadır.</p>
      </div>
    );
  }

  const handleToggle = (monthYear: string) => {
    setExpandedGroupId(expandedGroupId === monthYear ? null : monthYear);
  };

  return (
    <div className="space-y-4">
      {groups.map((group: PaymentGroup) => {
        const monthYear = `${group.month}-${group.year}`;
        return (
          <PaymentGroupComponent
            key={monthYear}
            group={group}
            isExpanded={expandedGroupId === monthYear}
            onToggle={() => handleToggle(monthYear)}
            onStatusUpdate={() => {
              // Ödeme durumu güncellendiğinde grupları yeniden hesapla
              const updatedGroups = groupPaymentsByMonth(payments);
              if (updatedGroups.length > 0) {
                const firstUnpaidGroup = updatedGroups.find(g => g.totalAmount > g.paidAmount);
                if (firstUnpaidGroup) {
                  setExpandedGroupId(`${firstUnpaidGroup.month}-${firstUnpaidGroup.year}`);
                }
              }
            }}
            onPaymentDelete={onPaymentDelete}
          />
        );
      })}
    </div>
  );
};