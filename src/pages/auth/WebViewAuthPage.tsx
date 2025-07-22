import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const WebViewAuthPage: React.FC = () => {
  const { user, loading, isWebView } = useAuth();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'not-authenticated'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa
    if (user) {
      setStatus('authenticated');
      // Ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 1000);
      return;
    }

    // Yükleme tamamlandıysa ve kullanıcı yoksa
    if (!loading && !user) {
      setStatus('not-authenticated');
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          TeknoKapsül
        </h1>

        {status === 'checking' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Kimlik doğrulaması kontrol ediliyor...</p>
          </div>
        )}

        {status === 'authenticated' && (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
              <p className="font-medium">Giriş başarılı!</p>
              <p className="text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
            </div>
          </div>
        )}

        {status === 'not-authenticated' && (
          <div className="text-center">
            {isWebView ? (
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4">
                <p className="font-medium">WebView içinde otomatik giriş bekleniyor</p>
                <p className="text-sm">Mobil uygulamadan giriş bilgileri bekleniyor...</p>
              </div>
            ) : (
              <div className="bg-blue-100 text-blue-700 p-4 rounded-lg mb-4">
                <p className="font-medium">Giriş yapılmadı</p>
                <p className="text-sm">Lütfen giriş sayfasına gidin ve giriş yapın.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Giriş Sayfasına Git
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isWebView && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Bu sayfa TeknoKapsül mobil uygulaması içinde görüntüleniyor.</p>
          <p>Otomatik giriş için mobil uygulamadan giriş yapmanız gerekmektedir.</p>
        </div>
      )}
    </div>
  );
};

export default WebViewAuthPage;