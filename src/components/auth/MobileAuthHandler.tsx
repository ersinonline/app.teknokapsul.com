import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Extend Window interface for Clerk
declare global {
  interface Window {
    Clerk?: {
      user?: any;
    };
  }
}

interface MobileAuthHandlerProps {
  onAuthSuccess?: () => void;
  onAuthFailure?: (error: any) => void;
}

/**
 * Mobil uygulamadan gelen kimlik doğrulama token'ını işleyen bileşen
 * Bu bileşen, sayfa yüklendiğinde otomatik olarak çalışır ve
 * URL'deki veya WebView mesajlarındaki token'ı işler
 */
export const MobileAuthHandler: React.FC<MobileAuthHandlerProps> = ({
  onAuthSuccess,
  onAuthFailure
}) => {
  const { user, isWebView, isMobile, forceUpdate } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);
  const [lastForceUpdate, setLastForceUpdate] = useState(0);

  // Mobil cihazlarda forceUpdate değiştiğinde auth state'ini kontrol et
  useEffect(() => {
    if (isMobile && forceUpdate !== lastForceUpdate) {
      setLastForceUpdate(forceUpdate);
      
      // Auth state değişikliklerini kontrol et
      setTimeout(() => {
        if (user && onAuthSuccess) {
          onAuthSuccess();
        }
      }, 100);
    }
  }, [forceUpdate, lastForceUpdate, isMobile, user, onAuthSuccess]);

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa işlem yapma
    if (user) {
      return;
    }

    // Token kontrolü yapılmadıysa
    if (!authAttempted) {
      setAuthAttempted(true);

      // URL'den token kontrolü yap (Clerk otomatik olarak handle eder)
      console.log('Mobil auth handler başlatıldı');
    }
  }, [user, isWebView, authAttempted, onAuthSuccess, onAuthFailure]);

  // Listen for storage and message events for authentication state changes
  useEffect(() => {
    if (isMobile) {
      let reloadTimeout: NodeJS.Timeout;
      let hasReloaded = false;

      const handleStorageChange = (e: StorageEvent) => {
        if ((e.key === 'clerk-db-jwt' || e.key?.includes('clerk')) && !hasReloaded) {
          console.log('Clerk storage changed on mobile');
          hasReloaded = true;
          // Prevent multiple reloads by using a flag and timeout
          clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            if (onAuthSuccess) {
              onAuthSuccess();
            }
          }, 100);
        }
      };

      const handleMessage = (e: MessageEvent<any>) => {
        if ((e.data === 'AUTH_STATE_CHANGED' || e.data?.type === 'clerk:oauth:success') && !hasReloaded) {
          console.log('Auth state changed message received on mobile');
          hasReloaded = true;
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      };

      // Listen for OAuth popup close events
      const handlePopupClose = () => {
        if (window.Clerk?.user && !hasReloaded) {
          console.log('OAuth popup closed, user authenticated');
          hasReloaded = true;
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('message', handleMessage);
      window.addEventListener('focus', handlePopupClose);

      return () => {
        clearTimeout(reloadTimeout);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('focus', handlePopupClose);
      };
    }
  }, [isMobile, onAuthSuccess]);

  // Bileşen görünmez, sadece işlevsellik sağlar
  return null;
};

export default MobileAuthHandler;