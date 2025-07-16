import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';

const PremiumCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Cancel Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Ödeme İptal Edildi
          </h1>
          <p className="text-gray-600 mb-8">
            Premium üyelik işleminiz iptal edildi. Endişelenmeyin, herhangi bir ücret tahsil edilmedi.
          </p>

          {/* Reasons */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">
              Neden iptal etmiş olabilirsiniz?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Ödeme bilgilerinizi tekrar kontrol etmek istiyorsunuz</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Premium özellikler hakkında daha fazla bilgi almak istiyorsunuz</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Farklı bir ödeme yöntemi kullanmak istiyorsunuz</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/premium')}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200"
              style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #e6a500, #e67e00)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #ffb700, #ff8c00)'}
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Deneyin
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ana Sayfaya Dön
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
              <MessageCircle className="w-4 h-4" />
              <span>Yardıma mı ihtiyacınız var?</span>
            </div>
            <p className="text-xs text-gray-400">
              Premium üyelik hakkında sorularınız için destek ekibimizle iletişime geçebilirsiniz.
            </p>
          </div>
        </div>

        {/* Special Offer */}
        <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center">
          <h3 className="font-bold mb-2">💡 Özel Teklif!</h3>
          <p className="text-sm mb-4">
            Premium özelliklerini ücretsiz deneyimlemek ister misiniz? 
            TEKNO25 kodunu kullanarak ilk ayınızı ücretsiz alabilirsiniz!
          </p>
          <button
            onClick={() => navigate('/premium')}
            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Ücretsiz Deneyin
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumCancelPage;