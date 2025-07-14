import { useState } from 'react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, OAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AlertCircle, Smartphone } from 'lucide-react';

interface SocialLoginProps {
  method?: 'google' | 'apple' | 'sms' | 'all';
}

export const SocialLogin = ({ method = 'all' }: SocialLoginProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const isWebView = () => {
    const userAgent = navigator.userAgent;
    return /wv|WebView|Android.*Version\/[.\d]+.*Chrome|iPhone.*AppleWebKit.*Mobile.*Safari|iPad.*AppleWebKit.*Mobile.*Safari/.test(userAgent);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      
      // For webview or mobile apps, use redirect method directly
      if (isWebView() || /Mobi|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      
      // For desktop browsers, try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup is blocked, fall back to redirect
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // User-friendly error messages
      if (error.code === 'auth/unauthorized-domain') {
        setError('Bu domain henüz yetkilendirilmemiş. Lütfen sistem yöneticisi ile iletişime geçin.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
      } else {
        setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      // For webview or mobile apps, use redirect method directly
      if (isWebView() || /Mobi|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      
      // For desktop browsers, try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup is blocked or fails, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      setError('Apple ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      setError('Lütfen telefon numaranızı girin.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Initialize reCAPTCHA
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            // reCAPTCHA solved
          }
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      console.error('Phone login error:', error);
      setError('SMS gönderilirken bir hata oluştu. Lütfen telefon numaranızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) {
      setError('Lütfen doğrulama kodunu girin.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
      console.error('Verification error:', error);
      setError('Doğrulama kodu hatalı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      
      {!showPhoneInput ? (
        <div className="space-y-3">
          {(method === 'all' || method === 'google') && (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              type="button"
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <img
                className="h-5 w-5 mr-3"
                src="https://www.google.com/favicon.ico"
                alt="Google"
              />
              <span>{isLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
            </button>
          )}

          {(method === 'all' || method === 'apple') && (
            <button
              onClick={handleAppleLogin}
              disabled={isLoading}
              type="button"
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>{isLoading ? 'Giriş yapılıyor...' : 'Apple ile Giriş Yap'}</span>
            </button>
          )}

          {(method === 'all' || method === 'sms') && (
            <button
              onClick={() => setShowPhoneInput(true)}
              disabled={isLoading}
              type="button"
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Smartphone className="h-5 w-5 mr-3" />
              <span>SMS ile Giriş Yap</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!confirmationResult ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+90 555 123 45 67"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handlePhoneLogin}
                disabled={isLoading}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'SMS Gönderiliyor...' : 'SMS Gönder'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doğrulama Kodu
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleVerifyCode}
                disabled={isLoading}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Doğrulanıyor...' : 'Doğrula'}
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setShowPhoneInput(false);
              setConfirmationResult(null);
              setPhoneNumber('');
              setVerificationCode('');
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Geri Dön
          </button>
          <div id="recaptcha-container"></div>
        </div>
      )}
    </div>
  );
};