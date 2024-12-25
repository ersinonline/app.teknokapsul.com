import { getMessaging, onMessage } from 'firebase/messaging';

const messaging = getMessaging();

export const setupNotificationListener = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted') {
      const { title, body } = payload.notification || {};
      new Notification(title || 'Yeni Bildirim', {
        body,
        icon: '/logo.ico'
      });
    }
    callback(payload);
  });
};