import React, { useState } from 'react';
import { Crown, Check, TrendingUp, Bell, Headphones, Package, Zap, Shield, BarChart3, Sparkles } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { useAuth } from '../contexts/AuthContext';
import { createPremiumSubscription, validatePromoCode } from '../services/premium.service';
import { useNavigate } from 'react-router-dom';

const PremiumIntroPage: React.FC = () => {
  const { user } = useAuth();
  const { isPremium, refreshPremiumStatus } = usePremium();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const handlePromoValidation = async () => {
    if (!promoCode.trim()) {
      setPromoValid(null);
      return;
    }

    try {
      const promoData = await validatePromoCode(promoCode, 'monthly');
      setPromoValid(promoData !== null);
    } catch (error) {
      setPromoValid(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPremiumSubscription('monthly', {
        userId: user.uid,
        planId: 'monthly',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        autoRenew: true,
        totalAmount: promoCode.trim() === 'TEKNO25' ? 0 : 19.99,
        promoCode: promoCode.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await refreshPremiumStatus();
      navigate('/premium/manage');
    } catch (error: any) {
      setError(error.message || 'Abonelik oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Anlık Döviz & Borsa Kurları',
      description: 'Döviz, fon, hisse ve altın kurlarını anlık olarak takip edin',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Package,
      title: 'Kargo Takibi',
      description: 'Kargolarınızı sitemizden çıkmadan direkt takip edin',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Bell,
      title: 'Akıllı Hatırlatmalar',
      description: 'Giderlerinizi 3 gün önceden e-posta ile hatırlayın',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Headphones,
      title: 'VIP Danışman Hizmeti',
      description: 'Ücretsiz premium danışmanlık hizmeti alın',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: BarChart3,
      title: 'Gelişmiş Analitik',
      description: 'Detaylı finansal raporlar ve analizler',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Shield,
      title: 'Premium Güvenlik',
      description: 'Gelişmiş güvenlik özellikleri ve veri koruması',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Hızlı İşlemler',
      description: 'Öncelikli işlem sırası ve hızlı yanıt',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Sparkles,
      title: 'AI Destekli Öneriler',
      description: 'Yapay zeka ile kişiselleştirilmiş finansal öneriler',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Premium Üyesiniz!
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              Tüm premium özelliklerden faydalanabilirsiniz.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/premium/manage')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Aboneliği Yönet
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 mb-6 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <Crown className="w-8 h-8 text-white" />
            <span className="text-white font-semibold">Premium Üyelik</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Teknokapsül
            <span className="block bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              Premium
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Finansal yönetiminizi bir üst seviyeye taşıyın. Premium özelliklerle daha akıllı, daha hızlı kararlar alın.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">
                ₺19.99<span className="text-lg font-normal">/ay</span>
              </div>
              <div className="text-white/80">
                İlk ay ücretsiz deneme
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">
                8+
              </div>
              <div className="text-white/80">
                Premium Özellik
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">
                7/24
              </div>
              <div className="text-white/80">
                VIP Destek
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Hemen Başla
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20">
              Özellikleri Gör
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Premium Özellikler
            </h2>
            <p className="text-lg text-gray-600">
              Finansal başarınız için ihtiyacınız olan tüm araçlar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="mb-4">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-orange-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Premium'a Başlayın
            </h2>
            <p className="text-lg text-gray-600">
              Hemen başlayın ve tüm premium özelliklerden faydalanın
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            {/* Promo Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promosyon Kodu (İsteğe bağlı)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValid(null);
                  }}
                  onBlur={handlePromoValidation}
                  placeholder="TEKNO25"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
                {promoValid === true && (
                  <div className="flex items-center px-3 py-2 bg-green-100 text-green-600 rounded-md">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                {promoValid === false && (
                  <div className="flex items-center px-3 py-2 bg-red-100 text-red-600 rounded-md text-sm">
                    Geçersiz
                  </div>
                )}
              </div>
              {promoCode === 'TEKNO25' && promoValid === true && (
                <p className="text-sm text-green-600 mt-1">
                  🎉 Tebrikler! İlk ay ücretsiz!
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-900">
                  Aylık Premium
                </span>
                <div className="text-right">
                  {promoCode === 'TEKNO25' && promoValid === true ? (
                    <>
                      <div className="text-sm text-gray-500 line-through">₺19.99</div>
                      <div className="text-2xl font-bold text-green-600">₺0.00</div>
                      <div className="text-xs text-gray-500">İlk ay, sonra ₺19.99/ay</div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">₺19.99</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Tüm premium özellikler
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  İstediğiniz zaman iptal edebilirsiniz
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  7/24 premium destek
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Premium'a Başla
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Premium aboneliğinizi istediğiniz zaman iptal edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumIntroPage;