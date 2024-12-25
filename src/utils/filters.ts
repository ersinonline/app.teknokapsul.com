import { Application, Payment } from '../types/data';
import { isSameMonth } from './date';

export const getActiveApplications = (applications: Application[]): Application[] => {
  return applications.filter(app => app.status === 'İnceleniyor');
};

export const getPendingPayments = (payments: Payment[]): Payment[] => {
  return payments.filter(payment => payment.status === 'Bekliyor');
};

export const getCurrentMonthPayments = (payments: Payment[]): Payment[] => {
  const now = new Date();
  return payments.filter(payment => 
    isSameMonth(new Date(payment.date), now)
  );
};