import { differenceInDays } from 'date-fns';
import { Payment } from '../types/data';
import { Subscription } from '../types/subscription';

export const checkPaymentNotifications = (payments: Payment[]): Payment[] => {
  const today = new Date();
  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const daysUntilPayment = differenceInDays(paymentDate, today);
    return daysUntilPayment <= 2 && daysUntilPayment > 0 && payment.status !== 'Ödendi';
  });
};

export const checkSubscriptionNotifications = (subscriptions: Subscription[]): Subscription[] => {
  const today = new Date();
  return subscriptions.filter(subscription => {
    const endDate = new Date(subscription.endDate);
    const daysUntilExpiration = differenceInDays(endDate, today);
    return daysUntilExpiration <= 2 && daysUntilExpiration > 0;
  });
};