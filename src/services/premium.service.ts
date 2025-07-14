import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  PremiumPlan, 
  PremiumSubscription, 
  PremiumUser, 
  PromoCode,
  PREMIUM_FEATURES 
} from '../types/premium';

// Premium Plan Management
export const createPremiumPlan = async (planData: Omit<PremiumPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'premium-plans'), {
      ...planData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating premium plan:', error);
    throw error;
  }
};

export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  try {
    const q = query(collection(db, 'premium-plans'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PremiumPlan[];
  } catch (error) {
    console.error('Error getting premium plans:', error);
    throw error;
  }
};

// Premium Subscription Management
export const createPremiumSubscription = async (
  planId: string, 
  subscriptionData: Omit<PremiumSubscription, 'id'>
): Promise<string> => {
  try {
    // Create subscription
    const subscriptionRef = await addDoc(collection(db, 'premium-subscriptions'), {
      userId: subscriptionData.userId,
      planId: planId,
      status: subscriptionData.status,
      startDate: subscriptionData.startDate.toISOString(),
      endDate: subscriptionData.endDate.toISOString(),
      autoRenew: subscriptionData.autoRenew,
      paymentMethod: subscriptionData.paymentMethod || 'credit_card',
      promoCode: subscriptionData.promoCode || null,
      discountAmount: subscriptionData.discountAmount || 0,
      totalAmount: subscriptionData.totalAmount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update user premium status
    const features = [PREMIUM_FEATURES.REAL_TIME_EXCHANGE_RATES, PREMIUM_FEATURES.CARGO_TRACKING, PREMIUM_FEATURES.EMAIL_REMINDERS, PREMIUM_FEATURES.VIP_SUPPORT, PREMIUM_FEATURES.ADVANCED_ANALYTICS, PREMIUM_FEATURES.UNLIMITED_TRANSACTIONS];
    await updateUserPremiumStatus(subscriptionData.userId, subscriptionRef.id, subscriptionData.startDate, subscriptionData.endDate, features);
    
    return subscriptionRef.id;
  } catch (error) {
    console.error('Error creating premium subscription:', error);
    throw error;
  }
};

export const getUserPremiumSubscription = async (userId: string): Promise<PremiumSubscription | null> => {
  try {
    const q = query(
      collection(db, 'premium-subscriptions'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startDate: new Date(doc.data().startDate),
      endDate: new Date(doc.data().endDate),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as PremiumSubscription;
  } catch (error) {
    console.error('Error getting user premium subscription:', error);
    throw error;
  }
};

export const cancelPremiumSubscription = async (userId: string): Promise<void> => {
  try {
    // Find user's active subscription
    const q = query(
      collection(db, 'premium-subscriptions'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Active subscription not found');
    }
    
    const subscriptionDoc = querySnapshot.docs[0];
    const subscription = subscriptionDoc.data() as PremiumSubscription;
    
    // Calculate new end date: start date + 30 days
    const startDate = new Date(subscription.startDate);
    const newEndDate = new Date(startDate);
    newEndDate.setDate(startDate.getDate() + 30);
    
    // Create cancellation request record
    await addDoc(collection(db, 'premium-cancellation-requests'), {
      userId: userId,
      subscriptionId: subscriptionDoc.id,
      originalEndDate: subscription.endDate,
      newEndDate: newEndDate.toISOString(),
      requestDate: serverTimestamp(),
      status: 'pending',
      canRestore: true,
      restoreDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days to restore
    });
    
    // Update subscription status to cancelled with new end date
    await updateDoc(doc(db, 'premium-subscriptions', subscriptionDoc.id), {
      status: 'cancelled',
      autoRenew: false,
      endDate: newEndDate.toISOString(),
      updatedAt: serverTimestamp()
    });
    
    // Update user premium status with new end date (still active until new end date)
    await setDoc(doc(db, 'teknokapsul', userId, 'premium', 'status'), {
      userId: userId,
      isPremium: true, // Keep premium active until new end date
      subscriptionId: subscriptionDoc.id,
      premiumStartDate: subscription.startDate,
      premiumEndDate: newEndDate.toISOString(),
      cancellationStatus: 'cancelled',
      canRestore: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
      console.error('Error cancelling premium subscription:', error);
      throw error;
    }
  };

// Restore cancelled subscription
export const restorePremiumSubscription = async (userId: string): Promise<void> => {
  try {
    // Find user's cancellation request
    const q = query(
      collection(db, 'premium-cancellation-requests'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('canRestore', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('No restorable cancellation request found');
    }
    
    const cancellationDoc = querySnapshot.docs[0];
    const cancellationData = cancellationDoc.data();
    
    // Check if restore deadline has passed
    const restoreDeadline = new Date(cancellationData.restoreDeadline);
    if (new Date() > restoreDeadline) {
      throw new Error('Restore deadline has passed');
    }
    
    // Find the cancelled subscription
    const subscriptionQ = query(
      collection(db, 'premium-subscriptions'),
      where('userId', '==', userId),
      where('status', '==', 'cancelled')
    );
    
    const subscriptionSnapshot = await getDocs(subscriptionQ);
    if (subscriptionSnapshot.empty) {
      throw new Error('Cancelled subscription not found');
    }
    
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    
    // Restore subscription
    await updateDoc(doc(db, 'premium-subscriptions', subscriptionDoc.id), {
      status: 'active',
      autoRenew: true,
      endDate: cancellationData.originalEndDate,
      updatedAt: serverTimestamp()
    });
    
    // Update cancellation request
    await updateDoc(doc(db, 'premium-cancellation-requests', cancellationDoc.id), {
      status: 'restored',
      canRestore: false,
      restoredAt: serverTimestamp()
    });
    
    // Update user premium status
    await updateDoc(doc(db, 'teknokapsul', userId, 'premium', 'status'), {
      isPremium: true,
      premiumEndDate: cancellationData.originalEndDate,
      cancellationStatus: null,
      canRestore: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error restoring premium subscription:', error);
    throw error;
  }
};

// Check if user can restore subscription
export const canRestoreSubscription = async (userId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'premium-cancellation-requests'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('canRestore', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return false;
    
    const cancellationData = querySnapshot.docs[0].data();
    const restoreDeadline = new Date(cancellationData.restoreDeadline);
    
    return new Date() <= restoreDeadline;
  } catch (error) {
    console.error('Error checking restore eligibility:', error);
    return false;
  }
};

// User Premium Status Management
export const updateUserPremiumStatus = async (
  userId: string,
  subscriptionId: string,
  startDate: Date,
  endDate: Date,
  features: string[]
): Promise<void> => {
  try {
    const premiumFeatures = features.map(feature => ({
      id: feature,
      name: feature,
      description: getPremiumFeatureDescription(feature),
      isEnabled: true
    }));
    
    await setDoc(doc(db, 'teknokapsul', userId, 'premium', 'status'), {
      userId,
      isPremium: true,
      subscriptionId,
      premiumStartDate: startDate.toISOString(),
      premiumEndDate: endDate.toISOString(),
      features: premiumFeatures,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user premium status:', error);
    throw error;
  }
};

export const getUserPremiumStatus = async (userId: string): Promise<PremiumUser | null> => {
  try {
    const docRef = doc(db, 'teknokapsul', userId, 'premium', 'status');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      userId: data.userId,
      isPremium: data.isPremium || false,
      subscriptionId: data.subscriptionId,
      premiumStartDate: data.premiumStartDate ? new Date(data.premiumStartDate) : undefined,
      premiumEndDate: data.premiumEndDate ? new Date(data.premiumEndDate) : undefined,
      features: data.features || []
    } as PremiumUser;
  } catch (error) {
    console.error('Error getting user premium status:', error);
    throw error;
  }
};

export const checkUserPremiumFeature = async (userId: string, featureId: string): Promise<boolean> => {
  try {
    const premiumStatus = await getUserPremiumStatus(userId);
    if (!premiumStatus || !premiumStatus.isPremium) return false;
    
    // Check if subscription is still valid
    if (premiumStatus.premiumEndDate && premiumStatus.premiumEndDate < new Date()) {
      return false;
    }
    
    return premiumStatus.features.some(feature => feature.id === featureId && feature.isEnabled);
  } catch (error) {
    console.error('Error checking user premium feature:', error);
    return false;
  }
};

// Promo Code Management
export const validatePromoCode = async (code: string, planId: string): Promise<PromoCode | null> => {
  try {
    // Special handling for TEKNO25 promo code
    if (code === 'TEKNO25') {
      return {
        id: 'tekno25-special',
        code: 'TEKNO25',
        discountType: 'percentage',
        discountValue: 100, // 100% discount (free first month)
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
        applicablePlans: ['monthly', 'yearly']
      };
    }
    
    const q = query(
      collection(db, 'promo-codes'),
      where('code', '==', code),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const promoDoc = querySnapshot.docs[0];
    const promoData = promoDoc.data() as PromoCode;
    
    const now = new Date();
    const validFrom = new Date(promoData.validFrom);
    const validUntil = new Date(promoData.validUntil);
    
    // Check validity period
    if (now < validFrom || now > validUntil) return null;
    
    // Check usage limit
    if (promoData.usageLimit && promoData.usedCount >= promoData.usageLimit) return null;
    
    // Check if applicable to plan
    if (promoData.applicablePlans.length > 0 && !promoData.applicablePlans.includes(planId)) return null;
    
    return {
      ...promoData,
      id: promoDoc.id,
      validFrom,
      validUntil
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return null;
  }
};

// Admin Functions
export const getAllPremiumSubscriptions = async (): Promise<PremiumSubscription[]> => {
  try {
    const q = query(collection(db, 'premium-subscriptions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: new Date(doc.data().startDate),
      endDate: new Date(doc.data().endDate),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PremiumSubscription[];
  } catch (error) {
    console.error('Error getting all premium subscriptions:', error);
    throw error;
  }
};

export const updateSubscriptionStatus = async (
  subscriptionId: string, 
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
): Promise<void> => {
  try {
    // Get subscription data first
    const subscriptionDoc = await getDoc(doc(db, 'premium-subscriptions', subscriptionId));
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }
    
    const subscription = subscriptionDoc.data() as PremiumSubscription;
    
    // Update subscription status
    await updateDoc(doc(db, 'premium-subscriptions', subscriptionId), {
      status,
      updatedAt: serverTimestamp()
    });
    
    // Update user premium status accordingly
    const isPremium = status === 'active' && new Date(subscription.endDate) > new Date();
    
    await updateDoc(doc(db, 'teknokapsul', subscription.userId, 'premium', 'status'), {
      isPremium,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};

export const extendUserSubscription = async (
  subscriptionId: string, 
  additionalDays: number
): Promise<void> => {
  try {
    const subscriptionDoc = await getDoc(doc(db, 'premium-subscriptions', subscriptionId));
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }
    
    const subscription = subscriptionDoc.data() as PremiumSubscription;
    const currentEndDate = new Date(subscription.endDate);
    const newEndDate = new Date(currentEndDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
    
    await updateDoc(doc(db, 'premium-subscriptions', subscriptionId), {
      endDate: newEndDate.toISOString(),
      updatedAt: serverTimestamp()
    });
    
    // Update user premium status
    await updateDoc(doc(db, 'teknokapsul', subscription.userId, 'premium', 'status'), {
      premiumEndDate: newEndDate.toISOString(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error extending user subscription:', error);
    throw error;
  }
};

// Helper Functions
const getPremiumFeatureDescription = (featureId: string): string => {
  const descriptions: Record<string, string> = {
    [PREMIUM_FEATURES.REAL_TIME_EXCHANGE_RATES]: 'Anlık değişen döviz, fon, hisse ve altın kurları',
    [PREMIUM_FEATURES.CARGO_TRACKING]: 'Direkt sitede kargo takibi',
    [PREMIUM_FEATURES.EMAIL_REMINDERS]: 'Giderleri 3 gün önceden e-posta hatırlatması',
    [PREMIUM_FEATURES.VIP_SUPPORT]: 'Ücretsiz VIP danışman hizmeti',
    [PREMIUM_FEATURES.ADVANCED_ANALYTICS]: 'Gelişmiş analitik raporlar',
    [PREMIUM_FEATURES.UNLIMITED_TRANSACTIONS]: 'Sınırsız işlem kaydı'
  };
  
  return descriptions[featureId] || featureId;
};

// Real-time subscription listener
export const subscribeToUserPremiumStatus = (
  userId: string, 
  callback: (premiumUser: PremiumUser | null) => void
): (() => void) => {
  const docRef = doc(db, 'teknokapsul', userId, 'premium', 'status');
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        userId: data.userId,
        isPremium: data.isPremium || false,
        subscriptionId: data.subscriptionId,
        premiumStartDate: data.premiumStartDate ? new Date(data.premiumStartDate) : undefined,
        premiumEndDate: data.premiumEndDate ? new Date(data.premiumEndDate) : undefined,
        features: data.features || []
      });
    } else {
      callback(null);
    }
  });
};