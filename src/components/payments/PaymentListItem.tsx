import React, { useState } from 'react';
import { CreditCard, Check, X, Clock, Tag } from 'lucide-react';
import { Payment } from '../../types/data';
import { updatePaymentStatus } from '../../services/payments.service';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_CATEGORIES } from '../../types/budget';

interface PaymentListItemProps {
  payment: Payment;
  onStatusUpdate?: () => void;
  onEdit?: (payment: Payment) => void;
}

export const PaymentListItem: React.FC<PaymentListItemProps> = ({ payment, onStatusUpdate, onEdit }) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
      await updatePaymentStatus(payment.id, user.uid, newStatus);
      setCurrentStatus(newStatus);
      onStatusUpdate?.();
    } catch (error) {
      setErrorMessage('Ödeme durumu güncellenemedi.');
      setCurrentStatus(payment.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const isUnpaid = currentStatus === 'Ödenmedi';
  const isPaid = currentStatus === 'Ödendi';

  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors ${
      isUnpaid ? 'bg-red-50/50' : isPaid ? 'bg-green-50/50' : ''
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isUnpaid ? 'bg-red-100' : 'bg-green-100'
        }`}>
          <CreditCard className={`w-5 h-5 ${
            isUnpaid ? 'text-red-600' : 'text-green-600'
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{payment.title}</h3>
              {payment.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Tag className="w-3 h-3 mr-1" />
                  {DEFAULT_CATEGORIES[payment.category]}
                </span>
              )}
            </div>
            <span className={`text-base font-medium ${
              isUnpaid ? 'text-red-600' : isPaid ? 'text-green-600' : 'text-gray-900'
            }`}>
              {formatCurrency(payment.amount)}
            </span>
          </div>
          {payment.type === 'installment' && payment.installment && (
            <p className="text-sm text-gray-600">
              Taksit: {payment.installment.current}/{payment.installment.total}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-gray-500">
            <span>{formatDate(payment.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(payment)}
            className="p-2 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 rounded-lg transition-colors"
            title="Düzenle"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleStatusUpdate}
          disabled={isUpdating}
          className={`p-2 rounded-lg transition-colors ${
            isUnpaid
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={isUnpaid ? 'Ödendi olarak işaretle' : 'Ödenmedi olarak işaretle'}
        >
          {isUpdating ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : isUnpaid ? (
            <X className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 mt-2 sm:mt-0">{errorMessage}</div>
      )}
    </div>
  );
};