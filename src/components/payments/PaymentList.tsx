import React, { useState, useCallback } from 'react';
import { Payment } from '../../types/data';
import { PaymentListItem } from './PaymentListItem';
import { formatCurrency } from '../../utils/currency';

interface PaymentListProps {
  payments: Payment[];
  onEdit?: (payment: Payment) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, onEdit }) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Group payments by month and year
  const groupedPayments = payments.reduce((acc, payment) => {
    const date = new Date(payment.date);
    const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        month: date.toLocaleString('tr-TR', { month: 'long' }),
        year: date.getFullYear(),
        payments: [],
        totalAmount: 0,
        paidAmount: 0
      };
    }
    
    acc[monthYear].payments.push(payment);
    acc[monthYear].totalAmount += payment.amount;
    if (payment.status === 'Ödendi') {
      acc[monthYear].paidAmount += payment.amount;
    }
    
    return acc;
  }, {} as Record<string, { 
    month: string;
    year: number;
    payments: Payment[];
    totalAmount: number;
    paidAmount: number;
  }>);

  // Sort groups by date (newest first)
  const sortedGroups = Object.entries(groupedPayments)
    .sort(([keyA], [keyB]) => {
      const [monthA, yearA] = keyA.split('-').map(Number);
      const [monthB, yearB] = keyB.split('-').map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  }, [expandedGroupId]);

  return (
    <div className="space-y-6">
      {sortedGroups.map(([groupId, group]) => (
        <div key={groupId} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleGroup(groupId)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/80 transition-colors"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {group.month} {group.year}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-gray-500">
                  Toplam: {formatCurrency(group.totalAmount)}
                </span>
                <span className="text-green-600">
                  Ödenen: {formatCurrency(group.paidAmount)}
                </span>
                {group.totalAmount - group.paidAmount > 0 && (
                  <span className="text-red-600">
                    Kalan: {formatCurrency(group.totalAmount - group.paidAmount)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {group.payments.length} borç
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedGroupId === groupId ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {expandedGroupId === groupId && (
            <div className="border-t divide-y divide-gray-100">
              {/* Sort payments by date within each group */}
              {[...group.payments]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((payment) => (
                  <PaymentListItem
                    key={payment.id}
                    payment={payment}
                    onStatusUpdate={() => {}}
                    onEdit={onEdit}
                  />
                ))
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
};