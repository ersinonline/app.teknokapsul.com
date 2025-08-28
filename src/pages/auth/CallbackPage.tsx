import { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export const CallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 OAuth callback işleniyor...');
        
        // URL parametrelerini kontrol et
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (error) {
          console.error('❌ OAuth hatası:', error);
          setStatus('error');
          setMessage(`OAuth hatası: ${error}`);
          
          // WebView parent'a hata mesajı gönder
          if ((window as any).flutter_inappwebview) {
            (window as any).flutter_inappwebview.callHandler('authError', {
              error: error,
              message: `OAuth hatası: ${error}`
            });
          }
          
          if ((window as any).AndroidInterface) {
            (window as any).AndroidInterface.onAuthError(error, `OAuth hatası: ${error}`);
          }
          
          // 3 saniye sonra login sayfasına yönlendir
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }
        
        // Firebase redirect result'ını kontrol et
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('✅ OAuth giriş başarılı:', result.user.email);
          setStatus('success');
          setMessage(`Hoş geldiniz, ${result.user.displayName || result.user.email}!`);
          
          // WebView parent'a başarı mesajı gönder
          if ((window as any).flutter_inappwebview) {
            (window as any).flutter_inappwebview.callHandler('authSuccess', {
              user: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
              }
            });
          }
          
          if ((window as any).AndroidInterface) {
            (window as any).AndroidInterface.onAuthSuccess(
              result.user.uid,
              result.user.email || '',
              result.user.displayName || '',
              result.user.photoURL || ''
            );
          }
          
          // Dashboard'a yönlendir
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.log('⚠️ OAuth result bulunamadı, manuel kontrol yapılıyor...');
          
          // Manuel token kontrolü (URL'de token varsa)
          if (code) {
            console.log('🔍 Authorization code bulundu:', code);
            setStatus('success');
            setMessage('Giriş işlemi tamamlanıyor...');
            
            // Dashboard'a yönlendir
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            console.log('❌ OAuth sonucu bulunamadı');
            setStatus('error');
            setMessage('Giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.');
            
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('❌ Callback işleme hatası:', error);
        setStatus('error');
        setMessage('Giriş işlemi sırasında bir hata oluştu.');
        
        // WebView parent'a hata mesajı gönder
        if ((window as any).flutter_inappwebview) {
          (window as any).flutter_inappwebview.callHandler('authError', {
            error: error.code || 'unknown',
            message: error.message || 'Bilinmeyen hata'
          });
        }
        
        if ((window as any).AndroidInterface) {
          (window as any).AndroidInterface.onAuthError(
            error.code || 'unknown',
            error.message || 'Bilinmeyen hata'
          );
        }
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {status === 'loading' && 'Giriş İşleniyor'}
                {status === 'success' && 'Giriş Başarılı'}
                {status === 'error' && 'Giriş Hatası'}
              </h2>
              
              <p className={`mt-2 text-sm ${getStatusColor()}`}>
                {message || (
                  status === 'loading' 
                    ? 'Lütfen bekleyin, giriş işleminiz kontrol ediliyor...' 
                    : ''
                )}
              </p>
            </div>
            
            {status === 'error' && (
              <div className="mt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Giriş Sayfasına Dön
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};