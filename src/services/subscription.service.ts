<<<<<<< HEAD
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Subscription, SubscriptionFormData } from '../types/subscription';

=======
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const subscriptionsRef = collection(db, 'subscription-end');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
<<<<<<< HEAD
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      endDate: doc.data().subscriptionEndDate,
      userId: doc.data().userId,
      autoRenew: doc.data().autoRenew || false,
      renewalDay: doc.data().renewalDay,
      price: doc.data().price || 0
    } as Subscription));
=======
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
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
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

export const addSubscription = async (userId: string, data: SubscriptionFormData): Promise<void> => {
  try {
<<<<<<< HEAD
    await addDoc(collection(db, 'subscription-end'), {
      name: data.name,
      subscriptionEndDate: data.autoRenew ? null : data.endDate,
      userId,
      autoRenew: data.autoRenew,
      renewalDay: data.autoRenew ? data.renewalDay : null,
      price: data.price || 0
=======
    if (!data.endDate && !data.autoRenew) {
      throw new Error('Bitiş tarihi veya yenileme günü gerekli');
    }

    const endDate = data.autoRenew && data.renewalDay
      ? calculateEndDate(data.renewalDay).toISOString()
      : new Date(data.endDate!).toISOString();

    await addDoc(collection(db, 'subscription-end'), {
      name: data.name,
      subscriptionEndDate: endDate,
      userId,
      autoRenew: data.autoRenew,
      renewalDay: data.autoRenew ? data.renewalDay : null,
      price: data.price || 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      lastRenewalDate: new Date().toISOString()
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
    });
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
<<<<<<< HEAD
=======
};

export const updateSubscription = async (
  subscriptionId: string,
  data: Partial<SubscriptionFormData>
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscription-end', subscriptionId);
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

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'subscription-end', subscriptionId));
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

export const toggleSubscriptionStatus = async (subscriptionId: string, isActive: boolean): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscription-end', subscriptionId);
    await updateDoc(subscriptionRef, { isActive });
  } catch (error) {
    console.error('Error toggling subscription status:', error);
    throw error;
  }
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
};