class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  async showNotification(title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: { action: string; title: string; icon?: string }[];
    requireInteraction?: boolean;
  } = {}): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction
      });
      return;
    }

    try {
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-192x192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        vibrate: [200, 100, 200]
      };

      if (options.actions && options.actions.length > 0) {
        notificationOptions.actions = options.actions;
      }

      await this.registration.showNotification(title, notificationOptions);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Vadeli hesap günlük getiri bildirimi
  async showDailyReturnNotification(depositName: string, amount: number, newTotal: number): Promise<void> {
    await this.showNotification('Vadeli Hesap Günlük Getiri', {
      body: `${depositName} hesabınıza ${amount.toFixed(2)} ₺ günlük getiri eklendi. Yeni bakiye: ${newTotal.toFixed(2)} ₺`,
      icon: '/icons/icon-192x192.png',
      tag: 'daily-return-added',
      data: {
        type: 'daily-return-added',
        depositName,
        amount,
        newTotal
      },
      actions: [
        {
          action: 'explore',
          title: 'Portföyü Görüntüle'
        },
        {
          action: 'close',
          title: 'Kapat'
        }
      ]
    });
  }

  // Vadeli hesap vade uyarısı
  async showMaturityWarningNotification(depositName: string, daysLeft: number): Promise<void> {
    await this.showNotification('Vadeli Hesap Vade Uyarısı', {
      body: `${depositName} hesabınızın vadesine ${daysLeft} gün kaldı.`,
      icon: '/icons/icon-192x192.png',
      tag: 'maturity-warning',
      data: {
        type: 'maturity-warning',
        depositName,
        daysLeft
      },
      requireInteraction: true,
      actions: [
        {
          action: 'explore',
          title: 'Detayları Görüntüle'
        },
        {
          action: 'close',
          title: 'Kapat'
        }
      ]
    });
  }

  // Vadeli hesap otomatik getiri başlatma bildirimi
  async showAutoReturnStartedNotification(depositCount: number): Promise<void> {
    await this.showNotification('Otomatik Getiri Başlatıldı', {
      body: `${depositCount} vadeli hesap için otomatik günlük getiri hesaplama başlatıldı.`,
      icon: '/icons/icon-192x192.png',
      tag: 'auto-return-started',
      data: {
        type: 'auto-return-started',
        depositCount
      },
      actions: [
        {
          action: 'explore',
          title: 'Portföyü Görüntüle'
        },
        {
          action: 'close',
          title: 'Tamam'
        }
      ]
    });
  }

  async scheduleNotification(title: string, options: {
    body?: string;
    icon?: string;
    delay: number; // milliseconds
    tag?: string;
    data?: any;
  }): Promise<void> {
    setTimeout(() => {
      this.showNotification(title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        data: options.data
      });
    }, options.delay);
  }

  async sendExpenseReminder(amount: number, category: string): Promise<void> {
    await this.showNotification('Harcama Hatırlatması', {
      body: `${category} kategorisinde ${amount} TL harcama eklemeyi unutmayın!`,
      icon: '/icons/icon-192x192.png',
      tag: 'expense-reminder',
      data: { type: 'expense-reminder', category, amount },
      actions: [
        {
          action: 'add-expense',
          title: 'Harcama Ekle'
        },
        {
          action: 'dismiss',
          title: 'Kapat'
        }
      ]
    });
  }

  async sendBudgetAlert(category: string, spent: number, limit: number): Promise<void> {
    const percentage = Math.round((spent / limit) * 100);
    
    await this.showNotification('Bütçe Uyarısı', {
      body: `${category} kategorisinde bütçenizin %${percentage}'ini harcadınız (${spent}/${limit} TL)`,
      icon: '/icons/icon-192x192.png',
      tag: 'budget-alert',
      data: { type: 'budget-alert', category, spent, limit },
      requireInteraction: true,
      actions: [
        {
          action: 'view-budget',
          title: 'Bütçeyi Görüntüle'
        },
        {
          action: 'dismiss',
          title: 'Tamam'
        }
      ]
    });
  }

  async sendPaymentReminder(description: string, amount: number, dueDate: Date): Promise<void> {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    await this.showNotification('Ödeme Hatırlatması', {
      body: `${description} ödemesi ${daysUntilDue} gün sonra vadesi dolacak (${amount} TL)`,
      icon: '/icons/icon-192x192.png',
      tag: 'payment-reminder',
      data: { type: 'payment-reminder', description, amount, dueDate },
      requireInteraction: true,
      actions: [
        {
          action: 'mark-paid',
          title: 'Ödendi Olarak İşaretle'
        },
        {
          action: 'snooze',
          title: 'Daha Sonra Hatırlat'
        }
      ]
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;