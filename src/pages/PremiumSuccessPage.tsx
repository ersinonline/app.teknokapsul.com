import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Crown, ArrowRight, Loader } from 'lucide-react';
import { verifyStripePremiumPayment } from '../services/premium.service';
import { usePremium } from '../contexts/PremiumContext';

const PremiumSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshPremiumStatus } = usePremium();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('Session ID bulunamadı');
        setVerifying(false);
        return;
      }

      try {
        const result = await verifyStripePremiumPayment(sessionId);
        
        if (result.success) {
          setVerified(true);
          // Premium durumunu yenile
          await refreshPremiumStatus();
        } else {
          setError('Ödeme doğrulanamadı');
        }
      } catch (error: any) {
        setError(error.message || 'Doğrulama sırasında bir hata oluştu');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, refreshPremiumStatus]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ödemeniz doğrulanıyor...
          </h2>
          <p className="text-gray-600">
            Lütfen bekleyin, işleminizi kontrol ediyoruz.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Doğrulama Hatası
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/premium')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Tekrar Dene
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
        <div className="w-full px-4 py-16">
          <div className="text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎉 Tebrikler!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Premium üyeliğiniz başarıyla aktifleştirildi.
            </p>

            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-semibold mb-8">
              <Crown className="w-5 h-5" />
              Premium Üye
            </div>

            {/* Features Preview */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Artık Bu Özellikleri Kullanabilirsiniz:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Anlık döviz & borsa kurları</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Gelişmiş kargo takibi</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Akıllı hatırlatmalar</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">AI finansal danışman</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Detaylı raporlar</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Öncelikli destek</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #e6a500, #e67e00)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #ffb700, #ff8c00)'}
              >
                Hemen Keşfet
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/premium/manage')}
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
              >
                Aboneliği Yönet
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-orange-50 rounded-xl p-6 w-full">
              <h4 className="font-semibold text-orange-900 mb-2">
                📧 E-posta Onayı
              </h4>
              <p className="text-orange-700 text-sm">
                Premium üyeliğinizle ilgili detaylar e-posta adresinize gönderildi. 
                Aboneliğinizi istediğiniz zaman yönetebilir veya iptal edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PremiumSuccessPage;