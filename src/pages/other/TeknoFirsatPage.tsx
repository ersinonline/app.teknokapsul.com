import React from 'react';
import { ExternalLink, Shield, Smartphone, ShoppingBag, Star, Gift, Percent, Server } from 'lucide-react';

const TeknoFirsatPage: React.FC = () => {
  const campaigns = [
    {
      id: 'sigortam',
      title: 'Sigortam.net',
      subtitle: '300 TL İndirim Kampanyası',
      description: 'Doğru ürün, iyi fiyat ve 7/24 hizmet ile sigorta ihtiyaçlarınızı karşılayın. 30\'a yakın sigorta şirketinden teklifleri karşılaştırın.',
      discount: '300 TL İndirim',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
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
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
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
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
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
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
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

  const handleCampaignClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">TeknoFırsat</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Özel kampanyalar ve indirimlerle teknoloji ve hizmet dünyasında tasarruf edin
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {campaigns.map((campaign) => {
            const Icon = campaign.icon;
            return (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
                onClick={() => handleCampaignClick(campaign.link)}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${campaign.color} p-6 text-white relative overflow-hidden`}>
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
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${campaign.color}`}></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full bg-gradient-to-r ${campaign.color} text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105`}
                  >
                    <span>Kampanyaya Git</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Neden TeknoFırsat?</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              TeknoFırsat ile teknoloji ve hizmet sektöründeki en avantajlı kampanyalara tek yerden erişin. 
              Güvenilir partnerlerimizle özel anlaşmalar yaparak sizlere en iyi fırsatları sunuyoruz. 
              Tüm kampanyalar doğrudan resmi sitelerden sağlanmakta ve güvenliğiniz önceliğimizdir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoFirsatPage;