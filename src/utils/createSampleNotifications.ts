import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NotificationData } from '../services/notification.service';

export const createSampleNotifications = async (userId: string) => {
  const sampleNotifications: Omit<NotificationData, 'id' | 'createdAt'>[] = [
    {
      title: 'Ödeme Hatırlatması',
      message: 'Netflix aboneliğinizin ödemesi yarın sona eriyor.',
      type: 'warning',
      category: 'subscription',
      userId,
      read: false,
      actionUrl: '/subscriptions',
      actionText: 'Abonelikleri Görüntüle'
    },
    {
      title: 'Yeni AI Analiz Raporu',
      message: 'Bu ayın harcama analiz raporunuz hazır.',
      type: 'info',
      category: 'ai',
      userId,
      read: false,
      actionUrl: '/analytics',
      actionText: 'Raporu Görüntüle'
    },
    {
      title: 'Ödeme Başarılı',
      message: 'Spotify abonelik ödemesi başarıyla tamamlandı.',
      type: 'success',
      category: 'payment',
      userId,
      read: true,
      actionUrl: '/subscriptions'
    },
    {
      title: 'Sistem Güncellemesi',
      message: 'TeknoKapsül uygulaması yeni özelliklerle güncellendi.',
      type: 'info',
      category: 'system',
      userId,
      read: false
    }
  ];

  try {
    const notificationsRef = collection(db, 'teknokapsul', userId, 'notifications');
    
    for (const notification of sampleNotifications) {
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: new Date()
      });
    }
    
    console.log('Sample notifications created successfully');
  } catch (error) {
    console.error('Error creating sample notifications:', error);
  }
};

// Kullanım için helper function
export const initializeSampleNotifications = async (userId: string) => {
  // Sadece geliştirme ortamında çalıştır
  if (process.env.NODE_ENV === 'development') {
    await createSampleNotifications(userId);
  }
};