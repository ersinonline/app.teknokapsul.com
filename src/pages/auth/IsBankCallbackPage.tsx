import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { isBankOAuthService } from '../../services/isbank-oauth.service';

/**
 * İş Bankası OAuth callback sayfası
 * İş Bankası'ndan gelen authorization code'u işler ve kullanıcıyı giriş yapar
 */
export const IsBankCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const handleCallback = async () => {
      try {
        // URL'den authorization code'u al
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Hata kontrolü
        if (error) {
          console.error('İş Bankası OAuth hatası:', error, errorDescription);
          setStatus('error');
          
          // Kullanıcı dostu hata mesajları
          let userMessage = 'İş Bankası girişinde bir hata oluştu';
          if (error === 'access_denied') {
            userMessage = 'İş Bankası girişi iptal edildi. Lütfen tekrar deneyin.';
          } else if (error === 'invalid_request') {
            userMessage = 'Geçersiz istek. Lütfen tekrar deneyin.';
          } else if (error === 'unauthorized_client') {
            userMessage = 'Yetkisiz istemci. Lütfen daha sonra tekrar deneyin.';
          } else if (error === 'unsupported_response_type') {
            userMessage = 'Desteklenmeyen yanıt türü.';
          } else if (error === 'invalid_scope') {
            userMessage = 'Geçersiz yetki kapsamı.';
          } else if (error === 'server_error') {
            userMessage = 'İş Bankası sunucusunda bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
          } else if (error === 'temporarily_unavailable') {
            userMessage = 'İş Bankası servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
          }
          
          setMessage(userMessage);
          return;
        }

        // Authorization code kontrolü
        if (!code) {
          setStatus('error');
          setMessage('Authorization code bulunamadı');
          return;
        }

        if (!state) {
          setStatus('error');
          setMessage('State parametresi bulunamadı');
          return;
        }

        console.log('İş Bankası authorization code alındı:', code);
        setMessage('İş Bankası ile giriş işlemi tamamlanıyor...');

        // İş Bankası OAuth servisini kullanarak giriş işlemini tamamla
        await isBankOAuthService.signInWithIsBank(code, state);
        
        setStatus('success');
        setMessage('İş Bankası ile giriş başarılı! Yönlendiriliyorsunuz...');
        
        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('İş Bankası callback hatası:', error);
        setStatus('error');
        setMessage(error.message || 'Giriş işlemi sırasında bir hata oluştu');
      }
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  // 10 saniye sonra otomatik olarak login sayfasına yönlendir
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <LoadingSpinner />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                İş Bankası Girişi
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Giriş Başarılı!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Giriş Hatası
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Giriş Sayfasına Dön
                </button>
                <p className="text-sm text-gray-500">
                  10 saniye sonra otomatik olarak yönlendirileceksiniz...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IsBankCallbackPage;