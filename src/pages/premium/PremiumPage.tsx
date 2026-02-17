import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../hooks/usePremium';
import { PREMIUM_CONFIG } from '../../services/premium.service';
import { initializeCheckoutForm } from '../../services/iyzico.service';
import {
  ArrowLeft, Crown, Shield, Zap, Smartphone, Clock, CreditCard,
  CheckCircle, Star, Sparkles, BadgeCheck, Loader2, AlertCircle, Gift
} from 'lucide-react';

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, subscription, daysRemaining, refundRemaining, loading: premiumLoading } = usePremium();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const features = [
    {
      icon: Shield,
      title: 'Komisyonsuz Fatura Ödemeleri',
      description: 'Tüm fatura ödemelerinizde komisyon alınmaz',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Gift,
      title: 'Aylık 150 TL İade Hakkı',
      description: 'Alınan hizmet bedelleri 2 iş günü içinde hesabınıza iade edilir',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Zap,
      title: 'Öncelikli Destek',
      description: 'Destek talepleriniz öncelikli olarak yanıtlanır',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      icon: Sparkles,
      title: 'Yeni Özelliklere İlk Erişim',
      description: 'Yeni çıkan özellikleri herkesten önce deneyin',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Smartphone,
      title: 'Mobil Uygulama Erişimi',
      description: 'TeknoKapsül mobil uygulamasına tam erişim',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
    {
      icon: Clock,
      title: '30 Günlük Abonelik',
      description: 'Otomatik yenileme yok, istediğiniz zaman yenileyin',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
    },
  ];

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      // İyzico ile ödeme başlat
      const result = await initializeCheckoutForm(
        user.uid,
        'premium-subscription',
        'TeknoKapsül Premium Abonelik',
        'Premium',
        PREMIUM_CONFIG.price,
        {
          name: user.displayName?.split(' ')[0] || 'Kullanıcı',
          surname: user.displayName?.split(' ').slice(1).join(' ') || 'TeknoKapsül',
          email: user.email || '',
        }
      );

      if (result.status === 'success' && result.checkoutFormContent) {
        // İyzico checkout formunu göster
        const checkoutDiv = document.getElementById('iyzico-checkout');
        if (checkoutDiv) {
          checkoutDiv.innerHTML = result.checkoutFormContent;
          const scripts = checkoutDiv.getElementsByTagName('script');
          for (let i = 0; i < scripts.length; i++) {
            const script = document.createElement('script');
            script.text = scripts[i].text;
            document.head.appendChild(script);
          }
        }
      } else {
        setPaymentError('Ödeme sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (error: any) {
      console.error('Ödeme hatası:', error);
      setPaymentError('Ödeme sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (premiumLoading) {
    return (
      <div className="page-container bg-background flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="page-container bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Premium Abonelik</h1>
              <p className="text-white/50 text-xs">Ayrıcalıklı deneyim</p>
            </div>
          </div>

          {/* Premium Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">TeknoKapsül Premium</h2>
            <p className="text-white/60 text-sm max-w-xs mx-auto">
              Tüm ayrıcalıklardan yararlanın, komisyonsuz ödeyin
            </p>
          </div>

          {/* Active Subscription Info */}
          {isPremium && subscription && (
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <BadgeCheck className="w-6 h-6 text-amber-400" />
                <span className="text-amber-300 font-bold text-lg">Premium Aktif</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-xs">Kalan Süre</p>
                  <p className="text-white font-bold text-lg">{daysRemaining} gün</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Kalan İade Hakkı</p>
                  <p className="text-white font-bold text-lg">{refundRemaining.toFixed(0)} ₺</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Başlangıç</p>
                  <p className="text-white/80 text-sm">
                    {new Date(subscription.startDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Bitiş</p>
                  <p className="text-white/80 text-sm">
                    {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Payment Error */}
          {paymentError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-red-300 font-bold">Hata</p>
                  <p className="text-red-200/70 text-sm">{paymentError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 pb-6">
        <div className="page-content">
          <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">
            Premium Ayrıcalıklar
          </h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                  <p className="text-white/50 text-xs mt-0.5">{feature.description}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-auto mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 pb-6">
        <div className="page-content">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <Star className="w-4 h-4 text-amber-400" />
              <Star className="w-4 h-4 text-amber-400" />
              <Star className="w-4 h-4 text-amber-400" />
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-4xl font-bold text-white">{PREMIUM_CONFIG.price}</span>
              <span className="text-white/60 text-lg">₺</span>
              <span className="text-white/40 text-sm">/ ay</span>
            </div>
            <p className="text-white/40 text-xs mb-1">30 günlük abonelik</p>
            <p className="text-amber-400/70 text-xs">Otomatik yenileme yok, dilediğiniz zaman yenileyin</p>
          </div>
        </div>
      </div>

      {/* İyzico Checkout Container */}
      <div id="iyzico-checkout" className="px-4"></div>

      {/* Purchase Button */}
      <div className="px-4 pb-8">
        <div className="page-content">
          {isPremium ? (
            <div className="space-y-3">
              <button
                disabled
                className="w-full py-4 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-base flex items-center justify-center gap-2 cursor-default"
              >
                <BadgeCheck className="w-5 h-5" />
                Premium Üyesiniz
              </button>
              {daysRemaining <= 7 && (
                <button
                  onClick={handlePurchase}
                  disabled={paymentLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all active:scale-[0.98]"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Aboneliği Yenile ({PREMIUM_CONFIG.price} ₺)
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={paymentLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all active:scale-[0.98]"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ödeme İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Premium'a Geç ({PREMIUM_CONFIG.price} ₺/ay)
                </>
              )}
            </button>
          )}

          <p className="text-white/30 text-xs text-center mt-4">
            Ödeme iyzico güvencesiyle alınır. Abonelik 30 gün sonra otomatik olarak sona erer.
            Tekrarlayan ödeme yapılmaz.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pb-10">
        <div className="page-content">
          <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">
            Sıkça Sorulan Sorular
          </h3>
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-white font-medium text-sm mb-1">Abonelik otomatik yenilenir mi?</h4>
              <p className="text-white/50 text-xs">Hayır, 30 gün sonra aboneliğiniz otomatik olarak sona erer. Dilediğiniz zaman tekrar satın alabilirsiniz.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-white font-medium text-sm mb-1">İade hakkı nasıl çalışır?</h4>
              <p className="text-white/50 text-xs">Premium üyeler alınan hizmet bedellerini 2 iş günü içinde hesaplarına iade alabilir. Aylık iade limiti {PREMIUM_CONFIG.monthlyRefundLimit} TL'dir.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-white font-medium text-sm mb-1">Komisyonsuz fatura ödemesi nedir?</h4>
              <p className="text-white/50 text-xs">Premium üyelerin fatura ödemelerinden herhangi bir komisyon kesilmez.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-white font-medium text-sm mb-1">Mobil uygulama erişimi nedir?</h4>
              <p className="text-white/50 text-xs">Premium üyeler TeknoKapsül mobil uygulamasına tam erişim hakkına sahip olur.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
