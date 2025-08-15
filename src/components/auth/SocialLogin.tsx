import { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AlertCircle, Smartphone, Apple, Building2 } from 'lucide-react';
import { PopupAuthManager } from './PopupAuthManager';
import { isBankOAuthService } from '../../services/isbank-oauth.service';

interface SocialLoginProps {
  method?: 'google' | 'apple' | 'sms' | 'isbank' | 'all';
}

export const SocialLogin = ({ method = 'all' }: SocialLoginProps) => { 
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const handleAuthSuccess = (user: any) => {
    console.log('✅ Giriş başarılı:', user.email);
    setError(null);
  };

  const handleAuthError = (errorMessage: string) => {
    console.error('❌ Giriş hatası:', errorMessage);
    setError(errorMessage);
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      setError('Lütfen telefon numaranızı girin.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Clean up existing reCAPTCHA verifier
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }

      // Check if reCAPTCHA container exists
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (!recaptchaContainer) {
        setError('reCAPTCHA container bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
        setIsLoading(false);
        return;
      }

      // Initialize reCAPTCHA with better configuration
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setError('reCAPTCHA süresi doldu. Lütfen tekrar deneyin.');
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          setError('reCAPTCHA hatası. Lütfen sayfayı yenileyip tekrar deneyin.');
        }
      });

      const appVerifier = (window as any).recaptchaVerifier;
      
      // Render the reCAPTCHA widget
      await appVerifier.render();
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      console.error('Phone login error:', error);
      
      // Clean up on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      
      if (error.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA doğrulaması başarısız. Lütfen sayfayı yenileyip tekrar deneyin.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setError('Geçersiz telefon numarası. Lütfen +90 ile başlayan geçerli bir numara girin.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      } else {
        setError('SMS gönderilirken bir hata oluştu. Lütfen telefon numaranızı kontrol edin.');
      }
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
            <PopupAuthManager
              provider="google"
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              onLoadingChange={setIsLoading}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <img
                className="h-5 w-5 mr-3"
                src="https://www.google.com/favicon.ico"
                alt="Google"
              />
              <span>{isLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
            </PopupAuthManager>
          )}

          {(method === 'all' || method === 'apple') && (
            <PopupAuthManager
              provider="apple"
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              onLoadingChange={setIsLoading}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Apple className="h-5 w-5 mr-3" />
              <span>{isLoading ? 'Giriş yapılıyor...' : 'Apple ile Giriş Yap'}</span>
            </PopupAuthManager>
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

          {(method === 'all' || method === 'isbank') && (
            <button
              onClick={() => isBankOAuthService.initiateLogin()}
              disabled={isLoading}
              type="button"
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Building2 className="h-5 w-5 mr-3" />
              <span>{isLoading ? 'Yönlendiriliyor...' : 'İş Bankası ile Giriş Yap'}</span>
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
              // Clean up reCAPTCHA
              if ((window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier.clear();
                (window as any).recaptchaVerifier = null;
              }
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