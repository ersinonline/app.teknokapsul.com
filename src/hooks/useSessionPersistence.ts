import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Oturum sürekliliğini sağlayan custom hook
 * Kullanıcının oturumunu uzun süre açık tutmak için çeşitli stratejiler uygular
 */
export const useSessionPersistence = () => {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Token yenileme stratejisi
    const refreshToken = async () => {
      try {
        await getToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // Her 15 dakikada bir token'ı yenile
    const tokenRefreshInterval = setInterval(refreshToken, 15 * 60 * 1000);

    // Sayfa görünürlük değişikliklerinde token'ı yenile
    const handleVisibilityChange = () => {
      if (!document.hidden && isSignedIn) {
        refreshToken();
      }
    };

    // Sayfa focus aldığında token'ı yenile
    const handleFocus = () => {
      if (isSignedIn) {
        refreshToken();
      }
    };

    // Network durumu değişikliklerinde token'ı yenile
    const handleOnline = () => {
      if (isSignedIn) {
        refreshToken();
      }
    };

    // Event listener'ları ekle
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      clearInterval(tokenRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [isSignedIn, getToken]);

  // Local storage'da oturum bilgilerini sakla
  useEffect(() => {
    if (isSignedIn) {
      localStorage.setItem('clerk_session_active', 'true');
      localStorage.setItem('clerk_session_timestamp', Date.now().toString());
    } else {
      localStorage.removeItem('clerk_session_active');
      localStorage.removeItem('clerk_session_timestamp');
    }
  }, [isSignedIn]);

  return {
    isSessionPersistent: !!isSignedIn
  };
};