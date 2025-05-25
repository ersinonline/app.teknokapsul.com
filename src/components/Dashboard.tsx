import React from 'react';
import { ShoppingBag, FileText, CreditCard, Clock } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { StatCard } from './dashboard/StatCard';
import { RecentItems } from './dashboard/RecentItems';
import { Alerts } from './dashboard/Alerts';
import { SpendingTrends } from './analytics/SpendingTrends';
import { BudgetOverview } from './dashboard/BudgetOverview';
import { LoyaltyCard } from './loyalty/LoyaltyCard';
import { useLoyalty } from '../hooks/useLoyalty';
import { Order, Payment } from '../types/data';
import { Subscription } from '../types/subscription';
import { calculateDaysRemaining } from '../utils/date';

export const Dashboard = () => {
  const { data: orders = [], loading: ordersLoading } = useFirebaseData<Order>('orders');
  const { data: payments = [], loading: paymentsLoading } = useFirebaseData<Payment>('payments');
  const { data: subscriptions = [], loading: subscriptionsLoading } = useFirebaseData<Subscription>('subscriptions');
  const { loyalty, loading: loyaltyLoading } = useLoyalty();

  const loading = ordersLoading || paymentsLoading || subscriptionsLoading || loyaltyLoading;

  const upcomingPayments = payments.filter(payment => {
    const daysRemaining = calculateDaysRemaining(payment.date);
    return payment.status === 'Ödenmedi' && daysRemaining <= 7 && daysRemaining > 0;
  });

  const expiringSubscriptions = subscriptions.filter(subscription => {
    const daysRemaining = calculateDaysRemaining(subscription.endDate);
    return daysRemaining <= 7 && daysRemaining > 0;
  });

  if (loading) return <LoadingSpinner />;
  if (!orders || !payments || !subscriptions) {
    return <ErrorMessage message="Veriler yüklenirken bir hata oluştu." />;
  }

  const stats = [
    {
      label: 'Toplam Sipariş',
      value: orders.length,
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      label: 'Yaklaşan Ödeme',
      value: upcomingPayments.length,
      icon: CreditCard,
      color: 'bg-yellow-500'
    },
    {
      label: 'Aktif Abonelik',
      value: subscriptions.filter(s => calculateDaysRemaining(s.endDate) > 0).length,
      icon: Clock,
      color: 'bg-purple-500'
    }
  ];

  // Calculate total paid amount
  const totalPaidAmount = payments.reduce((sum, payment) => {
    if (payment.status === 'Ödendi') {
      const amount = typeof payment.amount === 'string' 
        ? parseFloat(payment.amount.replace(' TL', '').replace(',', '.'))
        : typeof payment.amount === 'number' ? payment.amount : 0;
      return sum + amount;
    }
    return sum;
  }, 0);

  // Calculate total subscription cost
  const totalSubscriptionCost = subscriptions.reduce((sum, subscription) => {
    const price = typeof subscription.price === 'string'
      ? parseFloat(subscription.price.replace(' TL', '').replace(',', '.'))
      : typeof subscription.price === 'number' ? subscription.price : 0;
    // Assuming frequency is monthly for simplicity, adjust if needed
    return sum + price; 
  }, 0);

  const additionalStats = [
    {
      label: 'Toplam Ödenen Borç',
      value: totalPaidAmount,
      icon: CreditCard,
      color: 'bg-green-500'
    },
    {
      label: 'Toplam Abonelik Maliyeti',
      value: totalSubscriptionCost,
      icon: Clock,
      color: 'bg-indigo-500'
    }
  ];

  const allStats = [...stats, ...additionalStats];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Hoş Geldiniz 👋
      </h1>

      <Alerts 
        upcomingPayments={upcomingPayments}
        expiringSubscriptions={expiringSubscriptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {loyalty && <LoyaltyCard loyalty={loyalty} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrends />
        <BudgetOverview />
      </div>
    </div>
  );
};