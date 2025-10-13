import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Subscription, SubscriptionFormData } from '../types/subscription';

const calculateEndDate = (renewalDay: number): Date => {
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), renewalDay);
  
  // Eğer seçilen gün bugünden önceyse, bir sonraki aya ayarla
  if (endDate < today) {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    console.log('Fetching subscriptions for user:', userId);
    const subscriptionsRef = collection(db, 'teknokapsul', userId, 'subscriptions');
    const querySnapshot = await getDocs(subscriptionsRef);
    
    console.log('Query snapshot size:', querySnapshot.size);
    const subscriptions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', data);
      return {
        id: doc.id,
        name: data.name,
        endDate: data.subscriptionEndDate,
        userId: data.userId,
        autoRenew: data.autoRenew || false,
        renewalDay: data.renewalDay,
        price: data.price || 0,
        isActive: data.isActive ?? true,
        lastRenewalDate: data.lastRenewalDate
      } as Subscription;
    });
    console.log('Processed subscriptions:', subscriptions);
    return subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

export const addSubscription = async (userId: string, data: SubscriptionFormData): Promise<void> => {
  try {
    if (!data.endDate && !data.autoRenew) {
      throw new Error('Bitiş tarihi veya yenileme günü gerekli');
    }

    const endDate = data.autoRenew && data.renewalDay
      ? calculateEndDate(data.renewalDay).toISOString()
      : new Date(data.endDate!).toISOString();

    await addDoc(collection(db, 'teknokapsul', userId, 'subscriptions'), {
      name: data.name,
      subscriptionEndDate: endDate,
      autoRenew: data.autoRenew,
      renewalDay: data.autoRenew ? data.renewalDay : null,
      price: data.price || 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      lastRenewalDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (
  subscriptionId: string,
  userId: string,
  data: Partial<SubscriptionFormData>
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'teknokapsul', userId, 'subscriptions', subscriptionId);
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.autoRenew !== undefined) {
      updateData.autoRenew = data.autoRenew;
      if (data.autoRenew && data.renewalDay) {
        updateData.renewalDay = data.renewalDay;
        updateData.subscriptionEndDate = calculateEndDate(data.renewalDay).toISOString();
      } else if (!data.autoRenew && data.endDate) {
        updateData.subscriptionEndDate = new Date(data.endDate).toISOString();
        updateData.renewalDay = null;
      }
    }

    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const deleteSubscription = async (subscriptionId: string, userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'subscriptions', subscriptionId));
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

export const toggleSubscriptionStatus = async (subscriptionId: string, userId: string, isActive: boolean, subscription?: Subscription): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'teknokapsul', userId, 'subscriptions', subscriptionId);
    const updateData: any = { isActive };
    
    // If activating a subscription, set new start date and calculate end date
    if (isActive && subscription) {
      const now = new Date();
      
      // Always set new start date when reactivating
      updateData.lastRenewalDate = now.toISOString();
      
      // Calculate new end date based on renewal settings
      if (subscription.autoRenew && subscription.renewalDay) {
        // For auto-renewal subscriptions, calculate end date from renewal day
        const newEndDate = calculateEndDate(subscription.renewalDay);
        updateData.subscriptionEndDate = newEndDate.toISOString();
      } else {
        // For non-auto-renewal subscriptions, set 30 days from today
        const newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + 30);
        updateData.subscriptionEndDate = newEndDate.toISOString();
      }
    }
    
    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error('Error toggling subscription status:', error);
    throw error;
  }
};