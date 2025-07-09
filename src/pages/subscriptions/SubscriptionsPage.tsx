import { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addSubscription, getUserSubscriptions } from '../../services/subscription.service';
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading subscriptions for user:', user.uid);
      const userSubscriptions = await getUserSubscriptions(user.uid);
      console.log('Loaded subscriptions:', userSubscriptions);
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

  const handleSubmit = async (data: SubscriptionFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      console.log('Adding subscription:', data);
      await addSubscription(user.uid, data);
      setSuccessMessage('Abonelik başarıyla eklendi.');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error adding subscription:', error);
      setError(error instanceof Error ? error : new Error('Abonelik eklenirken bir hata oluştu.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!user) return <ErrorMessage message="Lütfen giriş yapın." />;

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500" />
                Aboneliklerim
              </h1>
              <p className="text-gray-600 mt-1 text-sm lg:text-base">
                Aboneliklerinizi takip edin ve yönetin
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm lg:text-base mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {successMessage}
            </div>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="mb-6">
            <SubscriptionStats subscriptions={sortedSubscriptions} />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Yeni Abonelik Ekle</h2>
          </div>
          <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <EmptyState
              icon={Clock}
              title="Abonelik Bulunamadı"
              description="Henüz hiç abonelik eklemediniz. Yukarıdaki formu kullanarak ilk aboneliğinizi ekleyin."
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Abonelik Listesi</h2>
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                  {subscriptions.length} abonelik
                </span>
              </div>
            </div>
            <SubscriptionTable subscriptions={sortedSubscriptions} onUpdate={loadSubscriptions} />
          </div>
        )}
      </div>
    </div>
  );
};