import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Event } from '../types/calendar';

const messaging = getMessaging();

const VAPID_KEY = 'BHgpQFYt4eS5sYmxVvzxOUPgUZLj7Y4q9Y5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

export const initializeNotifications = async (userId: string) => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    await setDoc(doc(db, 'user-notifications', userId), {
      fcmToken: token,
      notificationEnabled: true,
      updatedAt: new Date().toISOString()
    });

    return token;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    throw error;
  }
};

export const setupNotificationListener = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted') {
      const { title, body } = payload.notification || {};
      new Notification(title || 'Yeni Bildirim', {
        body,
        icon: '/logo.ico',
        badge: '/logo.ico'
      });
    }
    callback(payload);
  });
};

export const updateNotificationSettings = async (userId: string, enabled: boolean) => {
  const userNotificationsRef = doc(db, 'user-notifications', userId);
  await updateDoc(userNotificationsRef, {
    notificationEnabled: enabled,
    updatedAt: new Date().toISOString()
  });
};

export const scheduleEventNotification = async (event: Event & { id: string }) => {
  try {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 30 * 60000); // 30 dakika önce

    await addDoc(collection(db, 'scheduled-notifications'), {
      type: 'event',
      eventId: event.id,
      userId: event.userId,
      scheduledFor: reminderDate.toISOString(),
      title: 'Etkinlik Hatırlatması',
      body: `"${event.title}" etkinliğiniz 30 dakika sonra başlayacak.`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error scheduling event notification:', error);
    throw error;
  }
};