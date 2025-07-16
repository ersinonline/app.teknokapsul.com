import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NotificationData } from '../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<(NotificationData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'teknokapsul', user.uid, 'notifications');
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

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'teknokapsul', user.uid, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'teknokapsul', user.uid, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    
    try {
      const promises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'teknokapsul', user.uid, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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
      <div className="min-h-screen bg-gray-50 pt-16 pb-20 lg:pt-0 lg:pb-0">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 lg:pt-0 lg:pb-0">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} okunmamış bildirim</p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>

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
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Okundu İşaretle"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
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