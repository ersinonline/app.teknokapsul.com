import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { 
  PremiumUser, 
  PremiumSubscription,
  PremiumFeatureType 
} from '../types/premium';
import { 
  getUserPremiumStatus, 
  getUserPremiumSubscription,
  subscribeToUserPremiumStatus 
} from '../services/premium.service';

interface PremiumContextType {
  premiumUser: PremiumUser | null;
  subscription: PremiumSubscription | null;
  loading: boolean;
  isPremium: boolean;
  hasFeature: (feature: PremiumFeatureType) => boolean;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [premiumUser, setPremiumUser] = useState<PremiumUser | null>(null);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPremiumStatus = async () => {
    if (!user) {
      setPremiumUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [premiumStatus, userSubscription] = await Promise.all([
        getUserPremiumStatus(user.uid),
        getUserPremiumSubscription(user.uid)
      ]);
      
      setPremiumUser(premiumStatus);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error loading premium status:', error);
      setPremiumUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshPremiumStatus = async () => {
    await loadPremiumStatus();
  };

  const hasFeature = (feature: PremiumFeatureType): boolean => {
    if (!premiumUser || !premiumUser.isPremium) return false;
    
    // Check if subscription is still valid
    if (premiumUser.premiumEndDate && premiumUser.premiumEndDate < new Date()) {
      return false;
    }
    
    return premiumUser.features.some(f => f.id === feature && f.isEnabled);
  };

  useEffect(() => {
    if (!user) {
      setPremiumUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Subscribe to real-time premium status updates
    const unsubscribe = subscribeToUserPremiumStatus(user.uid, (premiumStatus) => {
      setPremiumUser(premiumStatus);
      setLoading(false);
    });

    // Load subscription data
    getUserPremiumSubscription(user.uid)
      .then(setSubscription)
      .catch(console.error);

    return unsubscribe;
  }, [user]);

  const value = {
    premiumUser,
    subscription,
    loading,
    isPremium: premiumUser?.isPremium || false,
    hasFeature,
    refreshPremiumStatus
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

// Hook for checking specific premium features
export const usePremiumFeature = (feature: PremiumFeatureType) => {
  const { hasFeature, loading, isPremium } = usePremium();
  
  return {
    hasFeature: hasFeature(feature),
    loading,
    isPremium
  };
};