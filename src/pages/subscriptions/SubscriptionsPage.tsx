import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CreditCard, AlertCircle, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addSubscription, getUserSubscriptions } from '../../services/subscription.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { SubscriptionForm } from '../../components/subscriptions/SubscriptionForm';
import { SubscriptionTable } from '../../components/subscriptions/SubscriptionTable';
import { SubscriptionStats } from '../../components/subscriptions/SubscriptionStats';
import { Subscription, SubscriptionFormData } from '../../types/subscription';
import { useNavigate } from 'react-router-dom';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      const userSubscriptions = await getUserSubscriptions(user.id);
      setSubscriptions(userSubscriptions);
      setError(null);
    } catch (err) {
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
      await addSubscription(user.id, data);
      setSuccessMessage('Abonelik başarıyla eklendi.');
      setShowForm(false);
      await loadSubscriptions();
    } catch (error) {
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
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-7 h-7 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-800">Aboneliklerim</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600">
            <Plus size={16} />
            {showForm ? 'Kapat' : 'Yeni Ekle'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni Abonelik Ekle</h2>
            <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </div>
        )}

        {subscriptions.length > 0 ? (
          <>
            <div className="mb-6">
              <SubscriptionStats subscriptions={sortedSubscriptions} />
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Abonelik Listesi</h2>
                <SubscriptionTable subscriptions={sortedSubscriptions} onUpdate={loadSubscriptions} />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <EmptyState
              icon={Clock}
              title="Abonelik Bulunamadı"
              description="Henüz hiç abonelik eklemediniz. Yeni bir abonelik ekleyerek takibe başlayın."
            />
          </div>
        )}
      </main>
    </div>
  );
};