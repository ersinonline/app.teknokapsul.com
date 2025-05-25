import React, { useState, useCallback } from 'react';
import { Payment } from '../../types/data';
import { PaymentListItem } from './PaymentListItem';
import { DEFAULT_CATEGORIES } from '../../types/budget';
import { formatCurrency } from '../../utils/currency';

interface PaymentListProps {
  payments: Payment[];
  onEdit?: (payment: Payment) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, onEdit }) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Group payments by category
  const groupedPayments = payments.reduce((acc, payment) => {
    const category = payment.category || 'other';
    if (!acc[category]) {
      acc[category] = {
        payments: [],
        totalAmount: 0,
        paidAmount: 0
      };
    }
    acc[category].payments.push(payment);
    acc[category].totalAmount += payment.amount;
    if (payment.status === 'Ödendi') {
      acc[category].paidAmount += payment.amount;
    }
    return acc;
  }, {} as Record<string, { payments: Payment[], totalAmount: number, paidAmount: number }>);

  const toggleGroup = useCallback((categoryId: string) => {
    setExpandedGroupId(expandedGroupId === categoryId ? null : categoryId);
  }, [expandedGroupId]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedPayments).map(([category, data]) => (
        <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleGroup(category)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/80 transition-colors"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {category === 'other' ? 'Diğer' : DEFAULT_CATEGORIES[category]}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-gray-500">
                  Toplam: {formatCurrency(data.totalAmount)}
                </span>
                <span className="text-green-600">
                  Ödenen: {formatCurrency(data.paidAmount)}
                </span>
                {data.totalAmount - data.paidAmount > 0 && (
                  <span className="text-red-600">
                    Kalan: {formatCurrency(data.totalAmount - data.paidAmount)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {data.payments.length} borç
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedGroupId === category ? 'rotate-180' : ''
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

          {expandedGroupId === category && (
            <div className="border-t divide-y divide-gray-100">
              {data.payments.map((payment) => (
                <PaymentListItem
                  key={payment.id}
                  payment={payment}
                  onStatusUpdate={() => {}}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};