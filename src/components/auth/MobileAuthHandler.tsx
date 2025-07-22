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
  const { user, isWebView } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);

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

  // Bileşen görünmez, sadece işlevsellik sağlar
  return null;
};

export default MobileAuthHandler;