import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Bell, Headphones, Package, AlertTriangle, CheckCircle, Shield, BarChart3, Calendar, Clock, CreditCard, Award } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { useAuth } from '../contexts/AuthContext';
import { restorePremiumSubscription, canRestoreSubscription } from '../services/premium.service';
import { useNavigate } from 'react-router-dom';

const PremiumManagePage: React.FC = () => {
  const { user } = useAuth();
  const { premiumUser, isPremium, refreshPremiumStatus } = usePremium();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');




  const premiumFeatures = [
    {
      icon: TrendingUp,
      title: 'Anlık Döviz & Borsa Kurları',
      description: 'Döviz, fon, hisse ve altın kurlarını anlık olarak takip edin',
      status: 'active'
    },
    {
      icon: Package,
      title: 'Kargo Takibi',
      description: 'Kargolarınızı sitemizden çıkmadan direkt takip edin',
      status: 'active'
    },
    {
      icon: Bell,
      title: 'Akıllı Hatırlatmalar',
      description: 'Giderlerinizi 3 gün önceden e-posta ile hatırlayın',
      status: 'active'
    },
    {
      icon: Headphones,
      title: 'VIP Danışman Hizmeti',
      description: 'Ücretsiz premium danışmanlık hizmeti alın',
      status: 'active'
    },
    {
      icon: BarChart3,
      title: 'Gelişmiş Analitik',
      description: 'Detaylı finansal raporlar ve analizler',
      status: 'active'
    },
    {
      icon: Shield,
      title: 'Premium Güvenlik',
      description: 'Gelişmiş güvenlik özellikleri ve veri koruması',
      status: 'active'
    }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isPremium) {
      navigate('/premium');
      return;
    }

    // Check if user can restore subscription
    const checkRestoreEligibility = async () => {
      if (user && premiumUser?.cancellationStatus === 'cancelled') {
        const canRestoreStatus = await canRestoreSubscription(user.uid);
        setCanRestore(canRestoreStatus);
      }
    };

    checkRestoreEligibility();
  }, [user, isPremium, navigate, premiumUser]);

  const handleCancelSubscription = async () => {
    if (!user) return;

    // Direkt Stripe billing portalına yönlendir
    window.open('https://billing.stripe.com/p/login/7sY6oGezng7111XcFh24000', '_blank');
  };

  const handleRestoreSubscription = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await restorePremiumSubscription(user.uid);
      await refreshPremiumStatus();
      setSuccess('Aboneliğiniz başarıyla geri alındı. Premium özelliklerden tekrar faydalanabilirsiniz.');
      setCanRestore(false);
    } catch (error: any) {
      setError(error.message || 'Abonelik geri alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Belirsiz';
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!premiumUser?.premiumEndDate) return null;
    const endDate = new Date(premiumUser.premiumEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  if (!isPremium || !premiumUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Premium Üyelik Bulunamadı
          </h1>
          <p className="text-gray-600 mb-6">
            Premium özelliklerden faydalanmak için üye olun.
          </p>
          <button
            onClick={() => navigate('/premium')}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            Premium'a Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200 py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Crown className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Premium Yönetimi
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Premium aboneliğinizi yönetin ve özelliklerinizi keşfedin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Premium Aktif</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-600 text-sm sm:text-base">{success}</p>
            </div>
          </div>
        )}



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Subscription Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                      <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Premium Plan
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600">
                        Tüm premium özellikleriniz aktif
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="rounded-xl p-6 border" style={{ background: 'linear-gradient(to bottom right, #fff8e1, #ffecb3)', borderColor: '#ffcc02' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Başlangıç Tarihi</span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {formatDate(premiumUser.premiumStartDate)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Bitiş Tarihi</span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {formatDate(premiumUser.premiumEndDate)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Kalan Gün</span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {daysRemaining !== null ? `${daysRemaining} gün` : 'Belirsiz'}
                    </p>
                  </div>
                </div>

                {daysRemaining !== null && (
                  <div className="mt-6 p-4 rounded-xl border" style={{ background: 'linear-gradient(to right, #fff8e1, #ffecb3)', borderColor: '#ffcc02' }}>
                    <div className="font-medium" style={{ color: '#e65100' }}>
                      {daysRemaining > 0 ? (
                        `Premium üyeliğiniz ${daysRemaining} gün sonra sona erecek.`
                      ) : (
                        'Premium üyeliğinizin süresi dolmuş.'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Premium Özellikleriniz
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Aktif premium özellikleriniz ve kullanım istatistikleri
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full self-start sm:self-auto">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold text-sm">6 Özellik Aktif</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {premiumFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  const colors = [
                    'from-orange-500 to-orange-600',
                    'from-green-500 to-green-600',
                    'from-yellow-500 to-yellow-600',
                    'from-orange-500 to-orange-600',
                    'from-red-500 to-red-600',
                    'from-cyan-500 to-cyan-600',
                    'from-yellow-500 to-yellow-600',
                    'from-pink-500 to-pink-600'
                  ];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="group bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                      <div className="mb-4">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${color}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base group-hover:text-orange-600 transition-colors">
                          {feature.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">
                            Aktif
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subscription Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Abonelik İşlemleri
                </h2>
                <p className="text-gray-600 text-sm">
                  Aboneliğinizi yönetin ve değişiklik yapın
                </p>
              </div>
              
              <div className="p-4 sm:p-6">
                {premiumUser?.cancellationStatus === 'cancelled' && canRestore ? (
                  <>
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3 text-yellow-800 mb-2">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base">Abonelik İptal Edildi</span>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        Aboneliğiniz iptal edildi ancak 7 gün içinde geri alabilirsiniz. Premium özellikleriniz hala aktif.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleRestoreSubscription}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          İşleniyor...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Aboneliği Geri Al
                        </div>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-6 space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Abonelik Yönetimi</h3>
                        <p className="text-blue-700 text-sm">
                          Premium aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal sonrası 7 gün içinde geri alabilirsiniz.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900">7</div>
                          <div className="text-gray-600 text-xs sm:text-sm">Gün geri alma süresi</div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg text-center">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900">₺0</div>
                          <div className="text-gray-600 text-xs sm:text-sm">İptal ücreti</div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.open('/premium-cancel', '_blank')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Aboneliği İptal Et
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Özet
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Durum</span>
                  <span className="text-sm font-medium text-green-600">Aktif</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Kalan Gün</span>
                  <span className="text-sm font-medium text-gray-900">
                    {daysRemaining !== null ? `${daysRemaining} gün` : 'Belirsiz'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Aktif Özellik</span>
                  <span className="text-sm font-medium text-gray-900">
                    {premiumUser.features.filter(f => f.isEnabled).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Hızlı İşlemler
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/premium')}
                  className="w-full px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Crown className="w-4 h-4" />
                  Premium Özellikleri
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-red-50 p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Aboneliği İptal Et
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Bu işlemi onaylamak istediğinizden emin misiniz?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4 text-sm sm:text-base">
                  Premium aboneliğinizi iptal etmek istediğinizden emin misiniz?
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Önemli Bilgiler:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Premium özellikleriniz 7 gün boyunca aktif kalacak</li>
                    <li>• Bu süre içinde aboneliğinizi geri alabilirsiniz</li>
                    <li>• İptal işlemi ücretsizdir</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      İptal Ediliyor...
                    </div>
                  ) : (
                    'İptal Et'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumManagePage;