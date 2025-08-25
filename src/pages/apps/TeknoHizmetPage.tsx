import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calculator, CreditCard, Shield, Receipt, Wifi, Smartphone, Tv, Gamepad2, X, ExternalLink } from 'lucide-react';

const TeknoHizmetPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const RESELLER_ID = "123456";
  const BAYI_ID = "54108";

  const hizmetFeatures = [
    {
      id: 'calculations',
      title: 'Hesaplama Araçları',
      description: 'MTV, Gelir Vergisi, Gecikme Zam ve Faiz hesaplamaları',
      icon: Calculator,
      color: 'bg-emerald-500'
    },
    {
      id: 'debt-inquiry',
      title: 'Borç Sorgulama',
      description: 'Vergi borcu, araç cezası ve harç ödemeleri',
      icon: CreditCard,
      color: 'bg-amber-500'
    },
    {
      id: 'insurance',
      title: 'Sigortalar',
      description: 'Trafik, Kasko, DASK, Konut ve diğer sigorta türleri',
      icon: Shield,
      color: 'bg-green-500'
    },
    {
      id: 'bill-payments',
      title: 'Fatura Ödemeleri',
      description: 'Telefon, internet, elektrik, doğalgaz fatura ödemeleri',
      icon: Receipt,
      color: 'bg-[#ffb700]'
    },
    {
      id: 'internet-tv',
      title: 'İnternet & TV',
      description: 'Fiber internet, TV paketleri ve dijital hizmetler',
      icon: Wifi,
      color: 'bg-indigo-500'
    },
    {
      id: 'gsm-operators',
      title: 'GSM Operatörleri',
      description: 'Numara taşıma, yeni hat ve mobil hizmetler',
      icon: Smartphone,
      color: 'bg-red-500'
    },
    {
      id: 'digital-codes',
      title: 'Film & Uygulama Kodları',
      description: 'TOD, D-Smart Go, Google Play, Apple Store paketleri',
      icon: Tv,
      color: 'bg-yellow-500'
    },
    {
      id: 'game-codes',
      title: 'Oyun Kodları',
      description: 'League of Legends, PUBG, Valorant ve diğer oyun paketleri',
      icon: Gamepad2,
      color: 'bg-pink-500'
    }
  ];

  // Kategori hizmetleri
  const categoryServices: { [key: string]: any[] } = {
    'calculations': [
      { name: 'MTV Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama` },
      { name: 'Gelir Vergisi Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GelirVergisiHesaplama` },
      { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHasaplama-yi` },
      { name: 'Kasko Değer Listesi', tag: 'Bilgi', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` }
    ],
    'debt-inquiry': [
      { name: 'Pasaport Bedeli Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/pasaportDegerliKagitBedeliOdeme` },
      { name: 'Diğer Harç Ödemeleri', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/digerHarcOdemeleri` },
      { name: 'MTV TPC Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
      { name: 'Cep Telefonu Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/cepTelefonuHarciOdeme` },
      { name: 'Sürücü Belgesi Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/surucuBelgesiHarciOdeme` },
      { name: 'GİB Vergi Borcu Sorgu', tag: 'Sorgu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu` },
      { name: 'Araç Ceza Sorgulama', tag: 'Sorgu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama` }
    ],
    'insurance': [
      { name: 'Trafik Sigortası', tag: 'Zorunlu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Kasko', tag: 'Popüler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'DASK', tag: 'Zorunlu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Konut Sigortası', tag: 'Önerilen', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Eşyam Güvende', tag: 'Yeni', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
    ],
    'bill-payments': [
      { name: 'Turkcell Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Vodafone Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Türk Telekom Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-telefon-faturasi-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Digiturk Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/digiturk-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'D-Smart Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'TTNET Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-internet-ttnet-fatura-odeme.html?bayiid=${BAYI_ID}` }
    ]
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const getSelectedCategoryData = () => {
    if (!selectedCategory) return null;
    const category = hizmetFeatures.find(f => f.id === selectedCategory);
    const services = categoryServices[selectedCategory] || [];
    return { category, services };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Anasayfaya Dön</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#ffb700] p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">TeknoHizmet</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#ffb700] p-4 rounded-full mr-4">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">🔧 TeknoHizmet</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            İhtiyacınız olan tüm hizmetler tek platformda. Güvenilir hizmet sağlayıcıları ile kaliteli çözümler.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hizmetFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => handleCategoryClick(feature.id)}
                className="bg-white border-2 border-[#ffb700] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-[#e6a500]"
              >
                <div className="p-6">
                  <div className={`${feature.color} p-3 rounded-lg inline-block mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffb700] font-medium text-sm">Hizmetleri Gör →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-white border-2 border-[#ffb700] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Hizmet Sağlayıcısı mısınız?</h2>
            <p className="text-gray-600 mb-6">
              TeknoHizmet platformuna katılın ve müşterilerinize daha kolay ulaşın.
            </p>
            <button className="bg-[#ffb700] hover:bg-[#e6a500] text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Hizmet Sağlayıcısı Ol
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {(() => {
              const data = getSelectedCategoryData();
              if (!data) return null;
              const { category, services } = data;
              const Icon = category?.icon;
              
              return (
                <>
                  {/* Modal Header */}
                  <div className={`${category?.color} p-6 text-white relative`}>
                    <button
                      onClick={closeModal}
                      className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        {Icon && <Icon className="w-8 h-8" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{category?.title}</h2>
                        <p className="text-white/90">{category?.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map((service, index) => (
                        <div
                          key={index}
                          onClick={() => window.open(service.url, '_blank')}
                          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-[#ffb700] rounded-xl p-4 cursor-pointer transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800 group-hover:text-[#ffb700] transition-colors">
                              {service.name}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              service.tag === 'Fatura' ? 'bg-blue-100 text-blue-700' :
                              service.tag === 'Ödeme' ? 'bg-green-100 text-green-700' :
                              service.tag === 'Sorgu' ? 'bg-purple-100 text-purple-700' :
                              service.tag === 'Hesaplama' ? 'bg-orange-100 text-orange-700' :
                              service.tag === 'Zorunlu' ? 'bg-red-100 text-red-700' :
                              service.tag === 'Popüler' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {service.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {services.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Bu kategori için henüz hizmet bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeknoHizmetPage;