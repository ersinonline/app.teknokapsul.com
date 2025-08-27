import React, { useEffect, useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { shouldUseNativeOAuth, sendMessageToApp, getWebViewSafeOAuthConfig } from '../../utils/webview';
import { useAuth } from '../../contexts/AuthContext';

interface WebViewSafeAuthProps {
  mode: 'sign-in' | 'sign-up';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const WebViewSafeAuth: React.FC<WebViewSafeAuthProps> = ({ mode, onSuccess, onError }) => {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isWebView: isInWebView } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebView içinde native OAuth kullanımını kontrol et
  const handleOAuthSignIn = async (provider: 'oauth_google' | 'oauth_apple' | 'oauth_facebook') => {
    if (shouldUseNativeOAuth()) {
      // Native OAuth için mobil uygulamaya mesaj gönder
      sendMessageToApp({
        type: 'oauth_request',
        provider: provider.replace('oauth_', ''),
        mode,
        timestamp: Date.now()
      });
      return;
    }

    // Web OAuth için normal Clerk akışı
    try {
      setLoading(true);
      setError(null);

      const config = getWebViewSafeOAuthConfig();
      
      if (mode === 'sign-in' && signIn) {
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: config.redirectUrl,
          redirectUrlComplete: config.redirectUrl
        });
      } else if (mode === 'sign-up' && signUp) {
        await signUp.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: config.redirectUrl,
          redirectUrlComplete: config.redirectUrl
        });
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || 'OAuth giriş hatası';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // WebView'dan gelen OAuth sonuçlarını dinle
  useEffect(() => {
    if (!isInWebView) return;

    const handleMessage = (event: Event) => {
      try {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        
        if (data.type === 'oauth_success') {
          // OAuth başarılı, Clerk session'ını güncelle
          if (data.token) {
            // Token ile session oluştur
            handleTokenAuth();
          }
        } else if (data.type === 'oauth_error') {
          setError(data.error || 'OAuth giriş hatası');
          onError?.(data.error || 'OAuth giriş hatası');
        }
      } catch (err) {
        console.error('WebView message parse error:', err);
      }
    };

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'oauth_success') {
          // OAuth başarılı, Clerk session'ını güncelle
          if (data.token) {
            // Token ile session oluştur
            handleTokenAuth();
          }
        } else if (data.type === 'oauth_error') {
          setError(data.error || 'OAuth giriş hatası');
          onError?.(data.error || 'OAuth giriş hatası');
        }
      } catch (err) {
        console.error('WebView message parse error:', err);
      }
    };

    // React Native WebView için
    if ((window as any).ReactNativeWebView) {
      document.addEventListener('message', handleMessage);
      window.addEventListener('message', handleWindowMessage);
    }

    return () => {
      document.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [isInWebView]);

  const handleTokenAuth = async () => {
    try {
      setLoading(true);
      
      // Clerk ile token doğrulama
      // Bu kısım Clerk'ın token authentication API'sine göre ayarlanmalı
      
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err?.message || 'Token doğrulama hatası';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isInWebView && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
          WebView içinde çalışıyorsunuz. OAuth girişleri mobil uygulama üzerinden gerçekleştirilecek.
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignIn('oauth_google')}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Yükleniyor...' : 'Google ile Giriş Yap'}
        </button>

        <button
          onClick={() => handleOAuthSignIn('oauth_apple')}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {loading ? 'Yükleniyor...' : 'Apple ile Giriş Yap'}
        </button>
      </div>
    </div>
  );
};

export default WebViewSafeAuth;