import React, { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { flutterClerkAuthService } from '../../services/flutter-clerk-auth.service';
import { processFlutterClerkAuth } from '../../api/clerk-flutter-auth';

interface FlutterAuthBridgeProps {
  onAuthSuccess?: (user: any) => void;
  onAuthError?: (error: string) => void;
  autoRedirect?: boolean;
  redirectUrl?: string;
}

/**
 * Flutter WebView için Clerk authentication bridge komponenti
 * 
 * Bu komponent Flutter uygulamasından gelen Clerk token'larını işler
 * ve web uygulamasında otomatik giriş sağlar.
 */
export const FlutterAuthBridge: React.FC<FlutterAuthBridgeProps> = ({
  onAuthSuccess,
  onAuthError,
  autoRedirect = true,
  redirectUrl = '/dashboard'
}) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isLoaded) return;

    // Zaten giriş yapılmışsa işlem yapma
    if (isSignedIn && user) {
      setAuthStatus('success');
      onAuthSuccess?.(user);
      
      if (autoRedirect) {
        window.location.href = redirectUrl;
      }
      return;
    }

    // Flutter auth listener'ını başlat
    setupFlutterAuthListeners();
    
    // URL'den token kontrolü
    checkUrlForClerkToken();
  }, [isLoaded, isSignedIn, user]);

  /**
   * Flutter'dan gelen auth mesajlarını dinler
   */
  const setupFlutterAuthListeners = () => {
    // PostMessage listener
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'flutter_clerk_auth') {
        await processClerkToken(event.data.sessionToken);
      }
    };

    window.addEventListener('message', handleMessage);

    // Flutter WebView interface kontrolü
    const checkFlutterInterface = async () => {
      if (window.FlutterInterface?.getClerkToken) {
        try {
          const tokenData = window.FlutterInterface.getClerkToken();
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            if (parsed.sessionToken) {
              await processClerkToken(parsed.sessionToken);
            }
          }
        } catch (error) {
          console.error('Flutter interface error:', error);
        }
      }
    };

    // Periyodik kontrol
    const intervalId = setInterval(checkFlutterInterface, 2000);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(intervalId);
    };
  };

  /**
   * URL parametrelerinden Clerk token kontrolü
   */
  const checkUrlForClerkToken = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clerkToken = urlParams.get('clerk_token');
    
    if (clerkToken) {
      await processClerkToken(clerkToken);
      
      // URL'den token parametresini temizle
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('clerk_token');
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  /**
   * Clerk token'ını işler
   */
  const processClerkToken = async (sessionToken: string) => {
    if (isProcessing || isSignedIn) return;

    setIsProcessing(true);
    setAuthStatus('processing');
    setErrorMessage('');

    try {
      // Backend'de Clerk session'ını doğrula ve Firebase token al
      const response = await fetch('/api/flutter-clerk-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        throw new Error('Token doğrulama başarısız');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Bilinmeyen hata');
      }

      // Firebase token ile authentication yap
      if (result.firebaseToken) {
        // Firebase custom token ile giriş yap
        // Bu kısım Firebase auth entegrasyonu gerektirir
        console.log('Firebase token received:', result.firebaseToken);
      }

      setAuthStatus('success');
      onAuthSuccess?.(result.user);

      if (autoRedirect) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      }
    } catch (error) {
      console.error('Clerk token işleme hatası:', error);
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setErrorMessage(errorMsg);
      setAuthStatus('error');
      onAuthError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Flutter'a auth durumu gönder
   */
  const sendAuthStatusToFlutter = (status: string, data?: any) => {
    // Android WebView
    if ((window as any).FlutterInterface?.onAuthStatusChange) {
      (window as any).FlutterInterface.onAuthStatusChange(JSON.stringify({ status, data }));
    }

    // iOS WebView
    if ((window as any).webkit?.messageHandlers?.authStatus) {
      (window as any).webkit.messageHandlers.authStatus.postMessage({ status, data });
    }

    // PostMessage
    window.parent.postMessage({
      type: 'auth_status_change',
      status,
      data
    }, '*');
  };

  // Auth durumu değiştiğinde Flutter'a bildir
  useEffect(() => {
    if (authStatus !== 'idle') {
      sendAuthStatusToFlutter(authStatus, {
        user: user,
        error: errorMessage
      });
    }
  }, [authStatus, user, errorMessage]);

  // Loading state
  if (!isLoaded || isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isProcessing ? 'Giriş yapılıyor...' : 'Yükleniyor...'}
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (authStatus === 'success' && isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Giriş Başarılı!</h2>
          <p className="text-green-600 mb-4">Hoş geldiniz, {user?.fullName || user?.firstName || 'Kullanıcı'}</p>
          {autoRedirect && (
            <p className="text-sm text-green-500">Yönlendiriliyorsunuz...</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (authStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Giriş Hatası</h2>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Default state - waiting for Flutter auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Kimlik Doğrulama Bekleniyor</h2>
        <p className="text-gray-600 mb-4">
          Flutter uygulamasından giriş bilgileriniz alınıyor...
        </p>
        <div className="text-sm text-gray-500">
          Bu işlem birkaç saniye sürebilir.
        </div>
      </div>
    </div>
  );
};

export default FlutterAuthBridge;

// TypeScript interface genişletmesi
declare global {
  interface Window {
    FlutterInterface?: {
      getClerkToken(): string;
    };
  }
}