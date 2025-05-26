import React from 'react';
import { CreditCard, Clock } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { StatCard } from './dashboard/StatCard';
import { Alerts } from './dashboard/Alerts';
import { SpendingTrends } from './analytics/SpendingTrends';
import { LoyaltyCard } from './loyalty/LoyaltyCard';
import { useLoyalty } from '../hooks/useLoyalty';
import { Payment } from '../types/data';
import { Subscription } from '../types/subscription';
import { calculateDaysRemaining } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export const Dashboard = () => {
  const { data: payments = [], loading: paymentsLoading } = useFirebaseData<Payment>('payments');
  const { data: subscriptions = [], loading: subscriptionsLoading } = useFirebaseData<Subscription>('subscriptions');
  const { loyalty, loading: loyaltyLoading } = useLoyalty();

  const loading = paymentsLoading || subscriptionsLoading || loyaltyLoading;

  // Tüm yaklaşan ödemeleri filtrele (15 gün içindekiler)
  const allUpcomingPayments = payments
    .filter(payment => {
      const daysRemaining = calculateDaysRemaining(payment.date);
      return payment.status === 'Ödenmedi' && daysRemaining > 0 && daysRemaining <= 15;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Dashboard'da gösterilecek en yakın 4 ödeme
  const displayedPayments = allUpcomingPayments.slice(0, 4);

  if (loading) return <LoadingSpinner />;
  if (!payments || !subscriptions) {
    return <ErrorMessage message="Veriler yüklenirken bir hata oluştu." />;
  }

  const currentDate = new Date();
  const monthlyUnpaidAmount = payments.reduce((sum, payment) => {
    const paymentDate = new Date(payment.date);
    if (
      payment.status === 'Ödenmedi' &&
      paymentDate.getMonth() === currentDate.getMonth() &&
      paymentDate.getFullYear() === currentDate.getFullYear()
    ) {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  const stats = [
    {
      label: 'Yaklaşan Ödeme',
      value: allUpcomingPayments.length, // Tüm yaklaşan ödemelerin sayısı
      icon: CreditCard,
      color: 'bg-yellow-500'
    },
    {
      label: 'Aktif Abonelik',
      value: subscriptions.filter(s => calculateDaysRemaining(s.endDate) > 0).length,
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      label: 'Aylık Ödenmeyen',
      value: formatCurrency(monthlyUnpaidAmount),
      icon: CreditCard,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Hoş Geldiniz 👋
      </h1>

      <Alerts 
        upcomingPayments={allUpcomingPayments}
        expiringSubscriptions={subscriptions.filter(s => {
          const daysRemaining = calculateDaysRemaining(s.endDate);
          return daysRemaining <= 7 && daysRemaining > 0;
        })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrends />
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Yaklaşan Ödemeler</h2>
          <div className="space-y-4">
            {displayedPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{payment.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <span className="font-medium text-red-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loyalty && <LoyaltyCard loyalty={loyalty} />}
    </div>
  );
};