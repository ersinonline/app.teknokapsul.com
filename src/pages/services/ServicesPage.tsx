import { 
  Shield, Receipt, Wifi, Smartphone, 
  Tv, Gamepad2, Wrench,
  Truck, Building, ExternalLink, Calculator, CreditCard
} from 'lucide-react';

const Services = () => {
  const RESELLER_ID = "123456";
  const REFID = "54108";
  const BAYI_ID = "54108";
  
  const serviceGroups = [
    // 1. TeknoKapsül Hizmetleri
    {
      title: 'TeknoKapsül Hizmetleri',
      icon: <Building className="w-8 h-8" />,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      services: [
        { name: 'Kargo Takip', tag: 'Ücretsiz', url: '/kargo-takip' },
        { name: 'Not Hatırlatıcı', tag: 'Ücretsiz', url: '/notlar' },
        { name: 'Takvim', tag: 'Ücretsiz', url: '/takvim' },
        { name: 'Bütçe Yönetimi', tag: 'Ücretsiz', url: '/butce' },
        { name: 'Portföy Takibi', tag: 'Ücretsiz', url: '/portfoy' },
        { name: 'AI Asistan', tag: 'Yeni', url: '/ai' }
      ]
    },

    // 2. Hesaplama Araçları
    {
      title: 'Hesaplama Araçları',
      icon: <Calculator className="w-8 h-8" />,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      services: [
        { name: 'Gecikme Zammı Hesaplama', tag: 'GİB', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.gib.gov.tr/hesaplama-araclari/gecikme-zammi-hesaplama' },
        { name: 'Vergi Hesaplama', tag: 'GİB', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.gib.gov.tr/hesaplama-araclari' },
        { name: 'SGK Prim Hesaplama', tag: 'SGK', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.sgk.gov.tr/hesaplama' },
        { name: 'Kıdem Tazminatı Hesaplama', tag: 'Çalışma', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.calisma.gov.tr/hesaplama' },
        { name: 'MTV Ödeme', tag: 'Taşıt', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.turkiye.gov.tr/mtv-odeme' }
      ]
    },

    // 2. Borç Sorgulama
    {
      title: 'Borç Sorgulama',
      icon: <CreditCard className="w-8 h-8" />,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      services: [
        { name: 'Vergi Borcu Sorgulama', tag: 'GİB', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://ivd.gib.gov.tr/tvd_server/VergiDairesi' },
        { name: 'SGK Borcu Sorgulama', tag: 'SGK', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.sgk.gov.tr/wps/portal/sgk/tr/calisan/sgk_hizmetleri' },
        { name: 'İcra Borcu Sorgulama', tag: 'UYAP', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://uyap.gov.tr/icra' },
        { name: 'Trafik Cezası Sorgulama', tag: 'EGM', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-sorgulama' },
        { name: 'KYK Borcu Öde', tag: 'KYK', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://kyk.ziraatbank.com.tr' }
      ]
    },

    // 3. Sigortalar (En önemli finansal hizmetler)
    {
      title: 'Sigortalar',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      services: [
        { name: 'Trafik Sigortası', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Kasko', tag: 'Popüler', url: `https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'DASK', tag: 'Zorunlu', url: `https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Konut Sigortası', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Eşyam Güvende', tag: 'Yeni', url: `https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', url: `https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Yabancı Sağlık', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/yabanci-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Ferdi Kaza', tag: 'Önerilen', url: `https://gelsinteklif.sigortayeri.com/ferdi-kaza-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Güvenli Cüzdan', tag: 'Yeni', url: `https://gelsinteklif.sigortayeri.com/guvenli-cuzdan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Fatura Koruma', tag: 'Avantajlı', url: `https://gelsinteklif.sigortayeri.com/fatura-koruma-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Evcil Hayvan', tag: 'Popüler', url: `https://gelsinteklif.sigortayeri.com/evcil-hayvan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'İlk Ateş', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/teklif-al/ilk-ates-sigortasi?reseller=${RESELLER_ID}` },
        { name: 'Seyahat Sağlık', tag: 'Gerekli', url: `https://gelsinteklif.sigortayeri.com/seyahat-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'IMM Sigortası', tag: 'Özel', url: `https://gelsinteklif.sigortayeri.com/imm-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
      ]
    },

    // 2. Fatura Ödemeleri (Temel ödemeler)
    {
      title: 'Fatura Ödemeleri',
      icon: <Receipt className="w-8 h-8" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      services: [
        { name: 'EnerjiSA', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'CK Enerji', tag: 'Elektrik', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İGDAŞ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'BAŞKENTGAZ', tag: 'Doğalgaz', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İSKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'ASKİ', tag: 'Su', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Elektrik', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Doğalgaz', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Su', tag: 'Tüm Şehirler', url: `https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` }
      ]
    },

    // 3. İnternet & TV
    {
      title: 'İnternet & TV',
      icon: <Wifi className="w-8 h-8" />,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      services: [
        { name: 'Superonline', tag: 'Fiber', url: 'https://www.superonlineinternet.com/superonline_kampanyalari.html' },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: 'http://www.onlineabonelik.com/millenicom-kampanyalari.html' },
        { name: 'KabloNET', tag: 'Avantajlı', url: 'https://www.tumhizmetler.com/turksat-internet-kampanyalari.html' },
        { name: 'Extranet', tag: 'Ekonomik', url: 'https://www.tumhizmetler.com/extranet-internet-kampanyalari.html' },
        { name: 'Şoknet', tag: 'Taahhütsüz', url: 'https://www.tumhizmetler.com/soknet-kampanyalari.html' },
        { name: 'D-Smart', tag: 'TV+İnternet', url: `https://www.smartabonelik.com.tr/bayi_online_basvuru.asp?urun=Dsmart&bayiid=${BAYI_ID}` },
        { name: 'Digitürk', tag: 'TV+İnternet', url: `https://www.digiturkburada.com.tr/basvuru?refid=${REFID}` }
      ]
    },

    // 4. GSM Operatörleri
    {
      title: 'GSM Operatörleri',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      services: [
        { name: 'Vodafone Numara Taşıma', tag: 'Popüler', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Vodafone Yeni Hat', tag: 'Yeni', url: 'https://basvuru.teknokapsul.com/apply/vodafone' },
        { name: 'Turkcell Numara Taşıma', tag: 'Güvenilir', url: 'https://basvuru.teknokapsul.com/apply/turkcell' },
        { name: 'Turkcell Yeni Hat', tag: 'Yeni', url: 'https://basvuru.teknokapsul.com/apply/turkcell' },
        { name: 'Türk Telekom Numara Taşıma', tag: 'Ekonomik', url: 'https://basvuru.teknokapsul.com/apply/turktelekom' },
        { name: 'Türk Telekom Yeni Hat', tag: 'Yeni', url: 'https://basvuru.teknokapsul.com/apply/turktelekom' }
      ]
    },

    // 5. Dijital Hizmetler
    {
      title: 'Dijital Hizmetler',
      icon: <Tv className="w-8 h-8" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      services: [
        { name: 'TOD TV', tag: 'Popüler', url: `https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}` },
        { name: 'D-Smart GO', tag: 'Yeni', url: `https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
        { name: 'GAIN', tag: 'Trend', url: `https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
        { name: 'S Sport Plus', tag: 'Spor', url: `https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` },
        { name: 'Google Play', tag: 'Android', url: `https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
        { name: 'App Store', tag: 'iOS', url: `https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` },
        { name: 'BluTV', tag: 'Dizi', url: `https://www.kodmarketim.com/blutv-paketleri-mid-3?refid=${REFID}` },
        { name: 'Exxen', tag: 'Spor', url: `https://www.kodmarketim.com/exxen-paketleri-mid-12?refid=${REFID}` },
        { name: 'Netflix', tag: 'Film', url: `https://www.kodmarketim.com/netflix-paketleri-mid-13?refid=${REFID}` },
        { name: 'Spotify', tag: 'Müzik', url: `https://www.kodmarketim.com/spotify-paketleri-mid-14?refid=${REFID}` }
      ]
    },

    // 6. Dijital Oyunlar
    {
      title: 'Dijital Oyunlar',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      services: [
        { name: 'Valorant', tag: 'En Çok Satan', url: `https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}` },
        { name: 'League of Legends', tag: 'Popüler', url: `https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}` },
        { name: 'PUBG Mobile', tag: 'Trend', url: `https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}` },
        { name: 'Point Blank', tag: 'FPS', url: `https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
        { name: 'Zula', tag: 'Yerli', url: `https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` },
        { name: 'Wolfteam', tag: 'MMO', url: `https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` },
        { name: 'Bombom', tag: 'Sosyal', url: `https://www.kodmarketim.com/bombom-paketleri-mid-15?refid=${REFID}` },
        { name: 'Brawl Stars', tag: 'Mobil', url: `https://www.kodmarketim.com/brawl-stars-paketleri-mid-16?refid=${REFID}` },
        { name: 'Silkroad Online', tag: 'MMORPG', url: `https://www.kodmarketim.com/silkroad-paketleri-mid-17?refid=${REFID}` },
        { name: 'Steam Wallet', tag: 'PC', url: `https://www.kodmarketim.com/steam-paketleri-mid-18?refid=${REFID}` }
      ]
    },

    // 7. Teknik Servis
    {
      title: 'Teknik Servis',
      icon: <Wrench className="w-8 h-8" />,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      services: [
        { name: 'iPhone Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'iPad Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'Apple Watch Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'AirPods Tamiri', tag: 'Apple', url: 'https://basvuru.teknokapsul.com/apply/apple_repair' },
        { name: 'Samsung Tamiri', tag: 'Samsung', url: 'https://basvuru.teknokapsul.com/apply/samsung_repair' },
        { name: 'Xiaomi Tamiri', tag: 'Xiaomi', url: 'https://basvuru.teknokapsul.com/apply/xiaomi_repair' },
        { name: 'Huawei Tamiri', tag: 'Huawei', url: 'https://basvuru.teknokapsul.com/apply/huawei_repair' },
        { name: 'OPPO Tamiri', tag: 'OPPO', url: 'https://basvuru.teknokapsul.com/apply/oppo_repair' }
      ]
    },

    // 8. Taşıt Hizmetleri
    {
      title: 'Taşıt Hizmetleri',
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700',
      services: [
        { name: 'İSPARK Ödeme', tag: 'Park', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.ispark.istanbul/odeme' },
        { name: 'Trafik Cezası Ödeme', tag: 'Ceza', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-odeme' },
        { name: 'HGS Bakiye Yükleme', tag: 'Geçiş', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.hgs.com.tr/bakiye-yukleme' },
        { name: 'OGS Bakiye Yükleme', tag: 'Geçiş', url: 'https://app.teknokapsul.com/yonlendirme.html?target=https://www.ogs.com.tr/bakiye-yukleme' }
      ]
    },

    // 9. Nakliyat Hizmetleri
    {
      title: 'Nakliyat Hizmetleri',
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700',
      services: [
        { name: 'Şehirler Arası Nakliyat', tag: 'Ev Taşıma', url: 'https://basvuru.teknokapsul.com/apply/moving' },
        { name: 'Parça Eşya Taşıma', tag: 'Parça Eşya', url: 'https://basvuru.teknokapsul.com/apply/moving' },
        { name: 'Ev Temizliği', tag: 'Standart', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` },
        { name: 'Ofis Temizliği', tag: 'Kurumsal', url: `https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` }
      ]
    },

    // 10. E-Hizmetler
    {
      title: 'E-Hizmetler',
      icon: <Building className="w-8 h-8" />,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700',
      services: [
        { name: 'E-İmza Başvurusu', tag: 'Kurumsal', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'KEP Adresi', tag: 'Resmi', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'E-Fatura', tag: 'Ticari', url: 'https://basvuru.teknokapsul.com/apply/e_services' }
      ]
    }
  ];

  const handleServiceClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tüm Hizmetler
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tüm hizmetlere tek yerden ulaşın, ihtiyacınıza en uygun çözümü bulun
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Service Groups */}
        <div className="space-y-12">
          {serviceGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="">
              {/* Group Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`${group.bgColor} ${group.borderColor} border-2 rounded-xl p-3 shadow-sm`}>
                  <div className={`${group.textColor}`}>
                    {group.icon}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
                  <p className="text-gray-500">{group.services.length} hizmet</p>
                </div>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.services.map((service, serviceIndex) => (
                  <div
                    key={serviceIndex}
                    onClick={() => handleServiceClick(service.url)}
                    className={`${group.bgColor} ${group.borderColor} border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-opacity-60 group`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
                        {service.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    </div>
                    
                    {service.tag && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${group.color} text-white`}>
                        {service.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              {groupIndex < serviceGroups.length - 1 && (
                <div className="border-t border-gray-200 mt-8"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aradığınız hizmeti bulamadınız mı?
          </h3>
          <p className="text-gray-600 mb-4">
            Bizimle iletişime geçin, size en uygun çözümü bulalım.
          </p>
          <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            İletişime Geç
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;