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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
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
      <div className="w-full px-3 sm:px-6 lg:px-8 py-3 lg:py-8">
        {/* Header */}
        <div className="mb-4 lg:mb-8">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-[#ffb700] p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 sm:p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">
                      Aboneliklerim
                    </h1>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-base">
                      Aboneliklerinizi takip edin ve yönetin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg lg:rounded-xl p-3 lg:p-4 mb-4 lg:mb-6 shadow-md lg:shadow-lg mx-1 lg:mx-0">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-green-500 rounded-md lg:rounded-lg">
                <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <p className="text-green-700 font-medium text-xs lg:text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="mb-4 lg:mb-6">
            <SubscriptionStats subscriptions={sortedSubscriptions} />
          </div>
        )}

        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden mb-4 lg:mb-6 mx-1 lg:mx-0">
          <div className="bg-[#ffb700]/10 p-4 lg:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Abonelik Ekle</h2>
                  <p className="text-gray-600 text-xs lg:text-sm">Ekleyerek takibinizi başlatın</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-[#ffb700] hover:bg-[#e6a600] text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} />
                {showForm ? 'Kapat' : 'Ekle'}
              </button>
            </div>
          </div>
          {showForm && (
            <div className="p-4 lg:p-6">
              <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
            </div>
          )}
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-8 lg:p-12 mx-1 lg:mx-0">
            <EmptyState
              icon={Clock}
              title="Abonelik Bulunamadı"
              description="Henüz hiç abonelik eklemediniz. Yukarıdaki formu kullanarak ilk aboneliğinizi ekleyin."
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden mx-1 lg:mx-0">
            <div className="bg-[#ffb700]/10 p-4 lg:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 lg:p-3 bg-[#ffb700] rounded-lg lg:rounded-xl shadow-md lg:shadow-lg">
                    <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900">Abonelik Listesi</h2>
                    <p className="text-gray-600 text-xs lg:text-sm">Tüm aboneliklerinizi görüntüleyin.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-[#ffb700]/20 text-[#ffb700] px-3 lg:px-4 py-1.5 lg:py-2 rounded-full">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="font-semibold text-xs lg:text-sm">{subscriptions.length} abonelik</span>
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