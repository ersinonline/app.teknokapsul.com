import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PaymentListItem } from './PaymentListItem';
import { PaymentGroup as PaymentGroupType } from '../../utils/payments';
import { formatCurrency } from '../../utils/currency';

interface PaymentGroupProps {
  group: PaymentGroupType;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdate: () => void;
}

export const PaymentGroup: React.FC<PaymentGroupProps> = ({
  group,
  isExpanded,
  onToggle,
  onStatusUpdate,
}) => {
  const sortedPayments = [...group.payments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const unpaidAmount = group.totalAmount - group.paidAmount;
  const hasUnpaidPayments = unpaidAmount > 0;
  const isFullyPaid = group.totalAmount === group.paidAmount && group.totalAmount > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
      hasUnpaidPayments ? 'border-l-4 border-red-500' : 
      isFullyPaid ? 'border-l-4 border-green-500' : ''
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50/80 transition-colors"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {group.month} {group.year}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
            <p className="text-sm text-gray-500">
              Toplam: {formatCurrency(group.totalAmount.toString())}
            </p>
            <p className="text-sm text-green-600">
              Ödenen: {formatCurrency(group.paidAmount.toString())}
            </p>
            {hasUnpaidPayments && (
              <p className="text-sm text-red-600">
                Kalan: {formatCurrency(unpaidAmount.toString())}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center mt-3 sm:mt-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t divide-y divide-gray-100">
          {sortedPayments.map((payment) => (
            <PaymentListItem
              key={payment.id}
              payment={payment}
              onStatusUpdate={onStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};