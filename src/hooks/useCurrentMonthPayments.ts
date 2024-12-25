import { useMemo } from 'react';
import { Payment } from '../types/data';
import { isCurrentMonth } from '../utils/date';

export const useCurrentMonthPayments = (payments: Payment[]) => {
  return useMemo(() => {
    return payments.filter(payment => isCurrentMonth(payment.date));
  }, [payments]);
};