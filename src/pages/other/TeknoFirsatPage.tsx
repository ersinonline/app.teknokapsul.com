import React from 'react';
import { ExternalLink, Shield, Smartphone, ShoppingBag, Star, Gift, Percent, Server, ArrowRight } from 'lucide-react';

const TeknoFirsatPage: React.FC = () => {
  const campaigns = [
    {
      id: 'sigortam',
      title: 'Sigortam.net',
      subtitle: '300 TL İndirim Kampanyası',
      description: 'Doğru ürün, iyi fiyat ve 7/24 hizmet ile sigorta ihtiyaçlarınızı karşılayın. 30\'a yakın sigorta şirketinden teklifleri karşılaştırın.',
      discount: '300 TL İndirim',
      icon: Shield,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      link: 'http://sgrtm.net/8J9L8400495JU',
      features: [
        'Trafik Sigortası',
        'Kasko Sigortası',
        'DASK Sigortası',
        'Konut Sigortası',
        'Sağlık Sigortası'
      ]
    },
    {
      id: 'vodafone',
      title: 'Vodafone',
      subtitle: 'İndirimli Tarifeler',
      description: 'Numara taşıma ve yeni hat kampanyalarından yararlanın. Online\'a özel avantajlar ve hediye GB\'ler sizi bekliyor.',
      discount: 'Online Avantajları',
      icon: Smartphone,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      link: 'https://www.vodafone.com.tr/numara-tasima-yeni-hat/tarifeler/MNP/postpaid/ALL?referer=amb-593d36a6-2508-4d2e-98b7-13dffd2dd9db&couponCode=TERCIH47BZG4K98&cid=perf-ambaff',
      features: [
        '12 Ay İndirimli Tarifeler',
        'Hediye GB Paketleri',
        'Ücretsiz Teslimat',
        'Online Özel Fiyatlar',
        'Tıkla Gel Al Hizmeti'
      ]
    },
    {
      id: 'ideasoft',
      title: 'IdeaSoft',
      subtitle: 'E-Ticaret Paketi İndirimi',
      description: '2005\'ten bu yana 45.000+ işletmenin tercihi IdeaSoft ile e-ticaret sitenizi kurun. Uzman e-ticaret altyapı çözümleri.',
      discount: 'Özel İndirim',
      icon: ShoppingBag,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      link: 'https://www.ideasoft.com.tr/?sc=676573096&scu=7342',
      features: [
        'Anahtar Teslim E-Ticaret',
        '7/24 Teknik Destek',
        '%99.9 Kesintisiz Altyapı',
        'Kullanıcı Dostu Arayüz',
        'VIP Danışman Desteği'
      ]
    },
    {
      id: 'hosting',
      title: 'Hosting.com.tr',
      subtitle: 'Web Hosting İndirimleri',
      description: 'Profesyonel web hosting hizmetleri ile sitenizi güvenli ve hızlı bir şekilde yayınlayın. Kurumsal e-posta ve hazır site çözümleri.',
      discount: '%30-72 İndirim',
      icon: Server,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      link: 'https://www.hosting.com.tr/aff.php?aff=484',
      features: [
        '%30 İndirimli Hosting',
        '%72 İndirimli Hazır Site',
        '%50 İndirimli Kurumsal E-Posta',
        '7/24 Teknik Destek',
        'Ücretsiz SSL Sertifikası'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'En Popüler Kampanyalar',
      description: 'En çok tercih edilen fırsatları keşfedin',
      icon: Star,
      action: () => window.scrollTo({ top: 400, behavior: 'smooth' })
    },
    {
      title: 'Teknoloji Fırsatları',
      description: 'Teknoloji ürünlerinde özel indirimler',
      icon: Smartphone,
      action: () => window.scrollTo({ top: 600, behavior: 'smooth' })
    },
    {
      title: 'Hizmet Kampanyaları',
      description: 'Dijital hizmetlerde avantajlı fiyatlar',
      icon: Server,
      action: () => window.scrollTo({ top: 800, behavior: 'smooth' })
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">TeknoFırsat</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Teknoloji ve hizmet sektöründeki en avantajlı kampanyalara tek yerden erişin. Güvenilir partnerlerimizle özel fırsatlar.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Hızlı Erişim</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-[#ffb700] to-[#ff9500] p-2 rounded-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#ffb700] transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Özel Kampanyalar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => {
              const Icon = campaign.icon;
              return (
                <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  {/* Card Header */}
                  <div className={`${campaign.color} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Icon className="w-12 h-12" />
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4" />
                            <span className="text-sm font-semibold">{campaign.discount}</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{campaign.title}</h3>
                      <p className="text-white/90 font-medium">{campaign.subtitle}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {campaign.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Öne Çıkan Özellikler
                      </h4>
                      <ul className="space-y-2">
                        {campaign.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className={`w-2 h-2 rounded-full ${campaign.color}`}></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <a
                      href={campaign.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full ${campaign.color} text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105`}
                    >
                      <span>Kampanyaya Git</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">⚡</span>
              <h3 className="text-2xl font-bold text-gray-900">Neden TeknoFırsat?</h3>
            </div>
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              TeknoFırsat ile teknoloji ve hizmet sektöründeki en avantajlı kampanyalara tek yerden erişin. 
              Güvenilir partnerlerimizle özel anlaşmalar yaparak sizlere en iyi fırsatları sunuyoruz. 
              Tüm kampanyalar doğrudan resmi sitelerden sağlanmakta ve güvenliğiniz önceliğimizdir.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Güvenli Alışveriş</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Özel Fırsatlar</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Gift className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Sürekli Kampanyalar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoFirsatPage;