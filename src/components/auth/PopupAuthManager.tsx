import { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, OAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface PopupAuthManagerProps {
  provider: 'google' | 'apple';
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PopupAuthManager = ({ provider, onSuccess, onError, onLoadingChange, disabled = false, className = '', children }: PopupAuthManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPopupHelp, setShowPopupHelp] = useState(false);

  useEffect(() => {
    // Redirect sonucunu kontrol et
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('✅ Redirect giriş başarılı:', result.user.email);
          onSuccess?.(result.user);
        }
      } catch (error: any) {
        console.error('❌ Redirect giriş hatası:', error);
        onError?.(error.message);
      }
    };

    checkRedirectResult();
  }, [onSuccess, onError]);

  const createAuthProvider = () => {
    if (provider === 'google') {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      // WebView için özel ayarlar - OAuth callback URL optimizasyonu
      if (isWebView()) {
        googleProvider.setCustomParameters({
          'prompt': 'select_account', // WebView'da hesap seçimi için
          'access_type': 'online', // WebView için online access
          'response_type': 'code', // Authorization code flow
          'redirect_uri': window.location.origin + '/auth/callback', // Explicit redirect URI
        });
      } else {
        googleProvider.setCustomParameters({
          'prompt': 'select_account',
        });
      }
      
      return googleProvider;
    } else {
      const appleProvider = new OAuthProvider('apple.com');
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      
      // WebView için özel ayarlar - Apple Sign-In optimizasyonu
      if (isWebView()) {
        appleProvider.setCustomParameters({
          'response_mode': 'form_post', // WebView için form post mode
          'redirect_uri': window.location.origin + '/auth/callback',
        });
      }
      
      return appleProvider;
    }
  };

  const isWebView = () => {
    const userAgent = navigator.userAgent;
    
    // Android WebView tespiti - daha kapsamlı kontrol
    const isAndroidWebView = /Android.*wv|Android.*Version\/[.\d]+.*Chrome/.test(userAgent) &&
                             !/Chrome\/[.\d]+ Mobile/.test(userAgent);
    
    // iOS WebView tespiti (WKWebView) - geliştirilmiş tespit
    const isIOSWebView = (/iPhone.*AppleWebKit.*Mobile.*Safari|iPad.*AppleWebKit.*Mobile.*Safari/.test(userAgent) && 
                        !userAgent.includes('CriOS') && 
                        !userAgent.includes('FxiOS') &&
                        !userAgent.includes('Version/')) ||
                        // WKWebView için ek kontrol
                        (userAgent.includes('iPhone') && userAgent.includes('AppleWebKit') && !userAgent.includes('Safari'));
    
    // Flutter WebView tespiti
    const isFlutterWebView = userAgent.includes('Flutter') || 
                            (window as any).flutter_inappwebview !== undefined ||
                            (window as any).flutter !== undefined;
    
    // Ek WebView kontrolleri - genişletilmiş
    const hasWebViewIndicators = window.navigator.standalone !== undefined || 
                                (window as any).AndroidInterface !== undefined ||
                                (window as any).webkit?.messageHandlers !== undefined ||
                                (window as any).ReactNativeWebView !== undefined ||
                                // URL parametresi kontrolü
                                window.location.search.includes('webview=true') ||
                                // Referrer kontrolü
                                document.referrer.includes('android-app://') ||
                                document.referrer.includes('ios-app://');
    
    const result = isAndroidWebView || isIOSWebView || isFlutterWebView || hasWebViewIndicators;
    
    if (result) {
      console.log('🔍 WebView tespit edildi:', {
        userAgent,
        isAndroidWebView,
        isIOSWebView,
        isFlutterWebView,
        hasWebViewIndicators
      });
    }
    
    return result;
  };

  const testPopupBlocker = (): boolean => {
    try {
      const testPopup = window.open('', '_blank', 'width=1,height=1,left=9999,top=9999');
      if (!testPopup || testPopup.closed) {
        return true; // Popup blocked
      }
      testPopup.close();
      return false; // Popup allowed
    } catch {
      return true; // Popup blocked
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);

    setShowPopupHelp(false);try {
      const authProvider = createAuthProvider();
      const providerName = provider === 'google' ? 'Google' : 'Apple';     
      console.log(`🚀 ${providerName} popup giriş başlatılıyor...`);

      // WebView kontrolü - geliştirilmiş yönlendirme
      if (isWebView()) {
        console.log('📱 WebView tespit edildi, redirect kullanılıyor');
        
        // WebView için özel callback URL ayarı
        const currentUrl = window.location.href;
        const callbackUrl = new URL('/auth/callback', window.location.origin).href;
        
        // WebView parent'a mesaj gönder (Flutter için)
        if ((window as any).flutter_inappwebview) {
          (window as any).flutter_inappwebview.callHandler('authStart', {
            provider: provider,
            callbackUrl: callbackUrl
          });
        }
        
        // Android Interface için mesaj
        if ((window as any).AndroidInterface) {
          (window as any).AndroidInterface.onAuthStart(provider, callbackUrl);
        }
        
        await signInWithRedirect(auth, authProvider);
        return;
      }

      // Popup blocker kontrolü
      if (testPopupBlocker()) {
        console.log('⚠️ Popup blocker tespit edildi, redirect kullanılıyor');
        await signInWithRedirect(auth, authProvider);
        return;
      }

      try {
        console.log(`🖥️ ${providerName} popup açılıyor...`);
        const result = await signInWithPopup(auth, authProvider);
        console.log(`✅ ${providerName} popup giriş başarılı:`, result.user.email);
        onSuccess?.(result.user);
      } catch (popupError: any) {
        console.log(`❌ ${providerName} popup hatası:`, popupError.code);
        
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          if (popupError.code === 'auth/popup-blocked') {
            setShowPopupHelp(true);
          } else {
            console.log('🔄 Popup kapatıldı, redirect deneniyor...');
            await signInWithRedirect(auth, authProvider);
          }
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error(`❌ ${provider} giriş hatası:`, error);
      onError?.(error.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleRedirectFallback = async () => {
    try {
      const authProvider = createAuthProvider();
      console.log('🔄 Redirect yöntemi kullanılıyor...');
      await signInWithRedirect(auth, authProvider);
    } catch (error: any) {
      console.error('❌ Redirect hatası:', error);
      onError?.(error.message || 'Redirect giriş başarısız');
    }
  };

  return (
    <div className="space-y-3">
      <div 
        onClick={disabled || isLoading ? undefined : handleAuth} 
        className={`${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {children}
      </div>
      
      {showPopupHelp && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800">Popup Engellenmiş</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Tarayıcınız popup pencerelerini engelliyor. Giriş yapmak için:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>Adres çubuğundaki popup simgesine tıklayın</li>
                <li>Bu site için popup'lara izin verin</li>
                <li>Veya aşağıdaki alternatif yöntemi kullanın</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAuth}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tekrar Dene
            </button>
            
            <button
              onClick={handleRedirectFallback}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              Yeni Sekmede Aç
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Giriş yapılıyor...</span>
        </div>
      )}
    </div>
  );
};