import { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
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
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-[#ffb700] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Aboneliklerim
                    </h1>
                    <p className="text-white/90 text-sm sm:text-base">
                      Aboneliklerinizi takip edin ve yönetin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-green-700 font-medium text-sm lg:text-base">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="mb-6">
            <SubscriptionStats subscriptions={sortedSubscriptions} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-[#ffb700]/10 p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#ffb700] rounded-xl shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Yeni Abonelik Ekle</h2>
                <p className="text-gray-600 text-sm">Yeni bir abonelik ekleyerek takibinizi başlatın</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
            <EmptyState
              icon={Clock}
              title="Abonelik Bulunamadı"
              description="Henüz hiç abonelik eklemediniz. Yukarıdaki formu kullanarak ilk aboneliğinizi ekleyin."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-[#ffb700]/10 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#ffb700] rounded-xl shadow-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Abonelik Listesi</h2>
                    <p className="text-gray-600 text-sm">Tüm aboneliklerinizi görüntüleyin ve yönetin</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-[#ffb700]/20 text-[#ffb700] px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold text-sm">{subscriptions.length} abonelik</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <SubscriptionTable subscriptions={sortedSubscriptions} onUpdate={loadSubscriptions} />
          </div>
        )}
      </div>
    </div>
  );
};