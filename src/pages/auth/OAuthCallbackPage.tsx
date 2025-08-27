import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sendMessageToApp, isWebView } from '../../utils/webview';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clerk = useClerk();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Clerk OAuth callback işlemi
        const result = await clerk.handleRedirectCallback({
          afterSignInUrl: '/',
          afterSignUpUrl: '/'
        });
        
        if (result && typeof result === 'object' && result !== null && 'createdSessionId' in result && result.createdSessionId) {
          setStatus('success');
          
          // WebView içindeyse ana uygulamaya başarı mesajı gönder
          if (isWebView()) {
            sendMessageToApp({
              type: 'oauth_success',
              sessionId: result.createdSessionId,
              timestamp: Date.now()
            });
          }
          
          // Başarılı girişten sonra yönlendirme
          setTimeout(() => {
            const redirectUrl = searchParams.get('redirect_url') || '/';
            navigate(redirectUrl, { replace: true });
          }, 1500);
        } else {
          throw new Error('OAuth callback failed - no session created');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message || 'OAuth giriş işlemi başarısız');
        
        // WebView içindeyse ana uygulamaya hata mesajı gönder
        if (isWebView()) {
          sendMessageToApp({
            type: 'oauth_error',
            error: err.message || 'OAuth giriş işlemi başarısız',
            timestamp: Date.now()
          });
        }
        
        // Hata durumunda login sayfasına yönlendir
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [clerk, navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          TeknoKapsül
        </h1>

        {status === 'processing' && (
          <div>
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Giriş işlemi tamamlanıyor...</p>
            {isWebView() && (
              <p className="text-sm text-gray-500 mt-2">
                WebView içinde OAuth işlemi gerçekleştiriliyor
              </p>
            )}
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium">Giriş başarılı!</p>
              <p className="text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-medium">Giriş başarısız</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
          </div>
        )}

        {isWebView() && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Bu sayfa TeknoKapsül mobil uygulaması içinde görüntüleniyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;