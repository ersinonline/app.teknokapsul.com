import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
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
      console.log('Loading subscriptions for user:', user.id);
      const userSubscriptions = await getUserSubscriptions(user.id);
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
      await addSubscription(user.id, data);
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
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-xl font-semibold text-gray-900">Aboneliklerim</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="ml-auto text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
            >
              <Plus className={`w-4 h-4 transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} />
              {showForm ? 'Kapat' : 'Yeni'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-green-700 font-medium text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="bg-[#ffb700]/10 p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#ffb700] rounded-xl shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Yeni Abonelik Ekle</h2>
                  <p className="text-gray-600 text-sm">Abonelik bilgilerini girerek takibinizi başlatın</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
            </div>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="mb-6">
            <SubscriptionStats subscriptions={sortedSubscriptions} />
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
            <EmptyState
              icon={Clock}
              title="Abonelik Bulunamadı"
              description="Henüz hiç abonelik eklemediniz. Yukarıdaki formu kullanarak ilk aboneliğinizi ekleyin."
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-[#ffb700]/10 p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#ffb700] rounded-xl shadow-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Abonelik Listesi</h2>
                    <p className="text-gray-600 text-sm">Tüm aboneliklerinizi görüntüleyin.</p>
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