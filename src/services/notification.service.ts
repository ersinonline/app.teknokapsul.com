import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event } from '../types/calendar';
import { app } from '../config/firebase';

export interface NotificationData {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'payment' | 'subscription' | 'budget' | 'ai' | 'system';
  userId: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  data?: any;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

let messaging = null;

if (typeof window !== 'undefined') {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.warn('Firebase Messaging is not supported:', error);
    }
}

const VAPID_KEY = 'BHgpQFYt4eS5sYmxVvzxOUPgUZLj7Y4q9Y5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

export const initializeNotifications = async (userId: string) => {
    try {
        if (!messaging || !('Notification' in window)) {
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

        if (db) {
            await setDoc(doc(db, 'user-notifications', userId), {
                fcmToken: token,
                notificationEnabled: true,
                updatedAt: new Date().toISOString()
            });
        }

        return token;
    } catch (error) {
        console.error('Error initializing notifications:', error);
        throw error;
    }
};

export const setupNotificationListener = (callback: (payload: any) => void) => {
    if (!messaging) return;

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
    try {
        if (!db) throw new Error('Firestore is not initialized');
        
        const userNotificationsRef = doc(db, 'user-notifications', userId);
        await updateDoc(userNotificationsRef, {
            notificationEnabled: enabled,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        throw error;
    }
};

export const scheduleEventNotification = async (event: Event & { id: string }) => {
    try {
        if (!db) throw new Error('Firestore is not initialized');

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

export const requestNotificationPermission = async () => {
    try {
        if (!messaging) {
            throw new Error('Firebase Messaging is not supported');
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });
            return token;
        }
        throw new Error('Notification permission denied');
    } catch (error) {
        console.error('Notification permission error:', error);
        throw error;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) {
            resolve(null);
            return;
        }

        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });