import React, { useState } from 'react';
import { CreditCard, Check, X, Clock, Trash2 } from 'lucide-react';
import { Payment } from '../../types/data';
import { updatePaymentStatus, deletePayment } from '../../services/payments.service';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentListItemProps {
  payment: Payment;
  onStatusUpdate?: () => void;
  onDelete?: () => void;
}

export const PaymentListItem: React.FC<PaymentListItemProps> = ({ payment, onStatusUpdate, onDelete }) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deletePayment(payment.id);
      onDelete?.();
    } catch (error) {
      setErrorMessage('Ödeme silinemedi.');
    } finally {
      setIsDeleting(false);
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
          <h3 className="font-medium text-gray-900 truncate">{payment.title}</h3>
          {payment.type === 'installment' && payment.installment && (
            <p className="text-sm text-gray-600">
              Taksit: {payment.installment.current}/{payment.installment.total}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-gray-500">
            <span>{formatDate(payment.date)}</span>
            {payment.bank && (
              <>
                <span className="hidden sm:block">•</span>
                <span>{payment.bank}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
        <span className={`text-base font-medium ${
          isUnpaid ? 'text-red-600' : isPaid ? 'text-green-600' : 'text-gray-900'
        }`}>
          {formatCurrency(payment.amount)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating || isDeleting}
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
          <button
            onClick={handleDelete}
            disabled={isUpdating || isDeleting}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Ödemeyi sil"
          >
            {isDeleting ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 mt-2 sm:mt-0">{errorMessage}</div>
      )}
    </div>
  );
};