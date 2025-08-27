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
          // Force redirect to dashboard after successful auth
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
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
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'clerk-db-jwt' || e.key?.includes('clerk')) {
          console.log('Clerk storage changed on mobile, reloading page');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        }
      };

      const handleMessage = (e: MessageEvent<any>) => {
        if (e.data === 'AUTH_STATE_CHANGED' || e.data?.type === 'clerk:oauth:success') {
          console.log('Auth state changed message received on mobile');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        }
      };

      // Listen for OAuth popup close events
      const handlePopupClose = () => {
        setTimeout(() => {
          if (window.Clerk?.user) {
            console.log('OAuth popup closed, user authenticated');
            window.location.href = '/dashboard';
          }
        }, 1000);
      };

      // Listen for hash changes (OAuth redirects)
      const handleHashChange = () => {
        if (window.location.hash.includes('oauth') || window.location.hash.includes('callback')) {
          console.log('OAuth hash detected, redirecting to dashboard');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      };

      // Listen for URL changes
      const handleUrlChange = () => {
        if (window.location.search.includes('__clerk_status=complete')) {
          console.log('Clerk OAuth complete detected');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('message', handleMessage);
      window.addEventListener('focus', handlePopupClose);
      window.addEventListener('hashchange', handleHashChange);
      window.addEventListener('popstate', handleUrlChange);

      // Check initial URL state
      handleUrlChange();
      handleHashChange();

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('focus', handlePopupClose);
        window.removeEventListener('hashchange', handleHashChange);
        window.removeEventListener('popstate', handleUrlChange);
      };
    }
  }, [isMobile]);

  // Bileşen görünmez, sadece işlevsellik sağlar
  return null;
};

export default MobileAuthHandler;