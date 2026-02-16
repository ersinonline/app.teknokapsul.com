import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Settings, Mail, Smartphone, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NotificationData } from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    expenses: true,
    income: true,
    subscriptions: true,
    portfolio: true,
    reminders: true
  });

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'teknokapsul', user.id, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as (NotificationData & { id: string })[];
      
      setNotifications(notificationsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string | undefined) => {
    if (!user?.id || !notificationId) return;
    
    try {
      const notificationRef = doc(db, 'teknokapsul', user.id, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string | undefined) => {
    if (!user?.id || !notificationId) return;
    
    try {
      const notificationRef = doc(db, 'teknokapsul', user.id, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    const unreadNotifications = notifications.filter(n => !n.read && n.id);
    
    try {
      const promises = unreadNotifications.map(notification => {
        if (!notification.id) return Promise.resolve();
        const notificationRef = doc(db, 'teknokapsul', user.id, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const updateNotificationSettings = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // Here you would typically save to Firebase or your backend
    console.log('Notification settings updated:', { [key]: value });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Bildirimler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bildirimler</h1>
                {unreadCount > 0 && (
                  <p className="text-white/60 text-xs">{unreadCount} okunmamış</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5 text-white" />
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="px-3 py-2 bg-white/15 text-white rounded-xl text-xs font-medium hover:bg-white/25 transition-colors">
                  Tümünü Oku
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">

        {/* Notification Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Bildirim Ayarları
            </h2>
            
            <div className="space-y-6">
              {/* Delivery Methods */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Bildirim Yöntemleri</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">E-posta Bildirimleri</span>
                    </div>
                    <button
                      onClick={() => updateNotificationSettings('email', !notificationSettings.email)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.email ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Smartphone className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">Push Bildirimleri</span>
                    </div>
                    <button
                      onClick={() => updateNotificationSettings('push', !notificationSettings.push)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.push ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.push ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Smartphone className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">SMS Bildirimleri</span>
                    </div>
                    <button
                      onClick={() => updateNotificationSettings('sms', !notificationSettings.sms)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.sms ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.sms ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Notification Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Bildirim Türleri</h3>
                <div className="space-y-3">
                  {[
                    { key: 'expenses', label: 'Gider Bildirimleri', icon: '💰' },
                    { key: 'income', label: 'Gelir Bildirimleri', icon: '💵' },
                    { key: 'subscriptions', label: 'Abonelik Bildirimleri', icon: '📱' },
                    { key: 'portfolio', label: 'Portföy Bildirimleri', icon: '📊' },
                    { key: 'reminders', label: 'Hatırlatmalar', icon: '⏰' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{item.icon}</span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <button
                        onClick={() => updateNotificationSettings(item.key, !notificationSettings[item.key as keyof typeof notificationSettings])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings[item.key as keyof typeof notificationSettings] ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationSettings[item.key as keyof typeof notificationSettings] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'Tümü', count: notifications.length },
            { key: 'unread', label: 'Okunmamış', count: unreadCount },
            { key: 'read', label: 'Okunmuş', count: notifications.length - unreadCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'Okunmamış bildirim yok' : 
                 filter === 'read' ? 'Okunmuş bildirim yok' : 'Henüz bildirim yok'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'Yeni bildirimler burada görünecek.' : ''}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  notification.read ? 'bg-white border-gray-200' : getNotificationColor(notification.type)
                } ${!notification.read ? 'shadow-sm' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: tr })}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          notification.category === 'payment' ? 'bg-green-100 text-green-700' :
                          notification.category === 'subscription' ? 'bg-blue-100 text-blue-700' :
                          notification.category === 'ai' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {notification.category === 'payment' ? 'Ödeme' :
                           notification.category === 'subscription' ? 'Abonelik' :
                           notification.category === 'ai' ? 'AI' : 'Sistem'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.actionUrl && (
                      <button
                        onClick={() => window.open(notification.actionUrl, '_blank')}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Bağlantıyı Aç"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    
                    {!notification.read && (
                      <button
                      onClick={() => notification.id && markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Okundu İşaretle"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    )}
                    
                    <button
                      onClick={() => notification.id && deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};