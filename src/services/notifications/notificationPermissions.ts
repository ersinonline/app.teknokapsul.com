import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const messaging = getMessaging();

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY'
      });

      await setDoc(doc(db, 'user-notifications', userId), {
        fcmToken: token,
        notifications: {
          paymentReminders: true,
          eventReminders: true,
          subscriptionReminders: true,
          statusUpdates: true
        }
      });

      return token;
    }
  } catch (error) {
    console.error('Notification permission error:', error);
    throw error;
  }
};