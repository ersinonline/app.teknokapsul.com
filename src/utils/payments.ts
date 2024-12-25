import { Payment } from '../types/data';
import { parseCurrency } from './currency';

export interface PaymentGroup {
  month: string;
  year: number;
  totalAmount: number;
  paidAmount: number;
  payments: Payment[];
  isFullyPaid: boolean;
}

export interface PaymentStats {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

const getMonthIndex = (monthName: string): number => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months.indexOf(monthName);
};

export const calculatePaymentStats = (payments: Payment[]): PaymentStats => {
  return payments.reduce((stats, payment) => {
    const amount = parseCurrency(payment.amount);
    stats.totalAmount += amount;
    
    if (payment.status === 'Ödendi') {
      stats.paidAmount += amount;
    } else {
      stats.pendingAmount += amount;
    }
    
    return stats;
  }, {
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0
  });
};

export const groupPaymentsByMonth = (payments: Payment[]): PaymentGroup[] => {
  // Tarih aralığı kontrolü
  const validPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const startDate = new Date(2024, 11, 1); // Aralık 2024
    const endDate = new Date(2026, 1, 28); // Şubat 2026
    return paymentDate >= startDate && paymentDate <= endDate;
  });

  // Ödemeleri aylara göre grupla
  const groups = validPayments.reduce((acc, payment) => {
    const date = new Date(payment.date);
    const month = date.toLocaleString('tr-TR', { month: 'long' });
    const year = date.getFullYear();
    const key = `${month}-${year}`;

    if (!acc[key]) {
      acc[key] = {
        month,
        year,
        totalAmount: 0,
        paidAmount: 0,
        payments: [],
        isFullyPaid: true
      };
    }

    const amount = parseCurrency(payment.amount);
    acc[key].totalAmount += amount;
    if (payment.status === 'Ödendi') {
      acc[key].paidAmount += amount;
    } else {
      acc[key].isFullyPaid = false;
    }
    acc[key].payments.push(payment);

    return acc;
  }, {} as Record<string, PaymentGroup>);

  // Grupları sırala:
  // 1. Tamamen ödenmiş aylar en sona
  // 2. Aynı ödeme durumundaki aylar kendi içlerinde tarihe göre sıralanır (eskiden yeniye)
  return Object.values(groups).sort((a, b) => {
    // Önce ödeme durumuna göre sırala (ödenmemiş olanlar önce)
    if (a.isFullyPaid !== b.isFullyPaid) {
      return a.isFullyPaid ? 1 : -1;
    }

    // Aynı ödeme durumundaki ayları tarihe göre sırala (eskiden yeniye)
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return getMonthIndex(a.month) - getMonthIndex(b.month);
  });
};