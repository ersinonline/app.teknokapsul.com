import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkPremiumStatus, PremiumSubscription, PREMIUM_CONFIG } from '../services/premium.service';

export const usePremium = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setSubscription(null);
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const sub = await checkPremiumStatus(user.uid);
        setSubscription(sub);
        setIsPremium(sub?.status === 'active');
      } catch (error) {
        console.error('Premium kontrol hatası:', error);
        setSubscription(null);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sub = await checkPremiumStatus(user.uid);
      setSubscription(sub);
      setIsPremium(sub?.status === 'active');
    } catch (error) {
      console.error('Premium yenileme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = subscription?.status === 'active' && subscription.endDate
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const refundRemaining = subscription?.status === 'active'
    ? (subscription.refundLimit - subscription.refundUsed)
    : 0;

  return {
    subscription,
    isPremium,
    loading,
    daysRemaining,
    refundRemaining,
    config: PREMIUM_CONFIG,
    refresh,
  };
};
