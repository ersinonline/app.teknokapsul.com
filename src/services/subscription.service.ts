import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Subscription, SubscriptionFormData } from '../types/subscription';

export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const subscriptionsRef = collection(db, 'subscription-end');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      endDate: doc.data().subscriptionEndDate,
      userId: doc.data().userId
    } as Subscription));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

export const addSubscription = async (userId: string, data: SubscriptionFormData): Promise<void> => {
  try {
    await addDoc(collection(db, 'subscription-end'), {
      name: data.name,
      subscriptionEndDate: data.endDate,
      userId
    });
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
};