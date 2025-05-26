<<<<<<< HEAD
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { addSubscription } from '../../services/subscription.service';
=======
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addSubscription, getUserSubscriptions } from '../../services/subscription.service';
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { SubscriptionForm } from '../../components/subscriptions/SubscriptionForm';
import { SubscriptionTable } from '../../components/subscriptions/SubscriptionTable';
import { SubscriptionStats } from '../../components/subscriptions/SubscriptionStats';
import { Subscription, SubscriptionFormData } from '../../types/subscription';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
<<<<<<< HEAD
  const { data: subscriptions = [], loading, error, reload } = useFirebaseData<Subscription>('subscriptions');
=======
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userSubscriptions = await getUserSubscriptions(user.uid);
      setSubscriptions(userSubscriptions);
      setError(null);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Abonelikler yüklenirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [user]);
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)

  const handleSubmit = async (data: SubscriptionFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await addSubscription(user.uid, data);
      setSuccessMessage('Abonelik başarıyla eklendi.');
<<<<<<< HEAD
      await reload(); // Veri yüklemesini yeniler
    } catch (error) {
      console.error('Error adding subscription:', error);
=======
      await loadSubscriptions();
    } catch (error) {
      console.error('Error adding subscription:', error);
      setError(error instanceof Error ? error : new Error('Abonelik eklenirken bir hata oluştu.'));
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
<<<<<<< HEAD
  if (error) return <ErrorMessage message="Abonelikler yüklenirken bir hata oluştu." />;
=======
  if (error) return <ErrorMessage message={error.message} />;
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
  if (!user) return <ErrorMessage message="Lütfen giriş yapın." />;

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Abonelik Takibi</h1>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {subscriptions.length > 0 && (
        <SubscriptionStats subscriptions={sortedSubscriptions} />
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Yeni Abonelik Ekle</h2>
        <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Abonelik Bulunamadı"
          description="Henüz hiç abonelik eklemediniz."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Aboneliklerim</h2>
          </div>
<<<<<<< HEAD
          <SubscriptionTable subscriptions={sortedSubscriptions} />
=======
          <SubscriptionTable subscriptions={sortedSubscriptions} onUpdate={loadSubscriptions} />
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
        </div>
      )}
    </div>
  );
};