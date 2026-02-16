import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Package } from 'lucide-react';

export const VerifyPage = () => {
  const { user, loading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getDefaultRedirect = () => '/';

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate(getDefaultRedirect(), { replace: true });
      } else {
        setError('Giriş yapılmamış. Lütfen giriş yapın.');
        setVerifying(false);
      }
    }
  }, [loading, user, navigate]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-yellow-800 font-medium">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDefaultRedirect()} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Doğrulama Başarısız</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <p className="text-gray-600 mb-6">
            Giriş linki geçersiz veya süresi dolmuş olabilir.
          </p>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    </div>
  );
};