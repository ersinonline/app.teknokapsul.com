import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mobileAuthService } from '../../services/mobile-auth.service';

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

      // URL'den token kontrolü yap
      mobileAuthService.checkAndSignInWithUrlToken()
        .then(success => {
          if (success) {
            console.log('Mobil token ile giriş başarılı');
            if (onAuthSuccess) {
              onAuthSuccess();
            }
          } else {
            if (isWebView) {
              console.log('URL token bulunamadı, WebView mesajları bekleniyor...');
            } else {
              console.log('URL token bulunamadı, normal web tarayıcısı');
            }
          }
        })
        .catch(error => {
          console.error('URL token ile giriş başarısız:', error);
          if (onAuthFailure) {
            onAuthFailure(error);
          }
        });
    }
  }, [user, isWebView, authAttempted, onAuthSuccess, onAuthFailure]);

  // Mobil cihazlarda sayfa görünürlük değişikliklerini dinle
  useEffect(() => {
    if (isMobile) {
      const handleStorageChange = (e: StorageEvent) => {
        // LocalStorage değişikliklerini dinle (auth state değişiklikleri için)
        if (e.key && e.key.includes('clerk') && e.newValue !== e.oldValue) {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      };

      const handleMessage = (event: MessageEvent) => {
        // WebView'dan gelen mesajları dinle
        if (event.data && event.data.type === 'AUTH_STATE_CHANGED') {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [isMobile]);

  // Bileşen görünmez, sadece işlevsellik sağlar
  return null;
};

export default MobileAuthHandler;