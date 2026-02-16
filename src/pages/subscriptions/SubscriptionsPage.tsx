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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Aboneliklerim</h1>
                <p className="text-white/60 text-xs">{subscriptions.length} abonelik</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className={`w-5 h-5 text-white transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {successMessage && (
          <div className="bank-card p-3 mb-4 border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-emerald-700 font-medium text-xs">{successMessage}</p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bank-card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Yeni Abonelik Ekle</h2>
                <p className="text-[11px] text-muted-foreground">Abonelik bilgilerini girin</p>
              </div>
            </div>
            <div className="p-4">
              <SubscriptionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
            </div>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="mb-4">
            <SubscriptionStats subscriptions={sortedSubscriptions} />
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div className="bank-card p-10 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Abonelik Bulunamadı</h3>
            <p className="text-xs text-muted-foreground">İlk aboneliğinizi eklemek için + butonunu kullanın.</p>
          </div>
        ) : (
          <div className="bank-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Abonelik Listesi</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                {subscriptions.length}
              </span>
            </div>
            <SubscriptionTable subscriptions={sortedSubscriptions} onUpdate={loadSubscriptions} />
          </div>
        )}
      </div>
    </div>
  );
};