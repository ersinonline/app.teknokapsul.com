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

    // WebView değilse ve token kontrolü yapılmadıysa
    if (!authAttempted) {
      setAuthAttempted(true);

      // URL'den token kontrolü yap
      mobileAuthService.checkAndSignInWithUrlToken()
        .then(success => {
          if (success && onAuthSuccess) {
            onAuthSuccess();
          } else if (!success && isWebView) {
            // WebView'da token bulunamadıysa, mobil uygulamadan gelen mesajları dinle
            console.log('URL token bulunamadı, WebView mesajları bekleniyor...');
          }
        })
        .catch(error => {
          console.error('Token kontrolü sırasında hata:', error);
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