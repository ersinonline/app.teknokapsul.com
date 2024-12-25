import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission, setupNotificationListener } from '../services/notification.service';

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user) return;

      try {
        await requestNotificationPermission(user.uid);
        
        setupNotificationListener((payload) => {
          console.log('Received notification:', payload);
        });
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user]);
};