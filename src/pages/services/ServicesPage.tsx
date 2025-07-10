import { useState, useEffect } from 'react';
import { 
  Shield, Receipt, Wifi, Smartphone, 
  Tv, Gamepad2, Wrench,
  Truck, Building, ExternalLink, Calculator, CreditCard,
  FileText, Clock, CheckCircle, AlertCircle, Eye, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/application.service';
import { Application } from '../../types/application';
import { useLocation } from 'react-router-dom';

const Services = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const { applicationNumber, successMessage } = location.state || {};

  useEffect(() => {
    const fetchApplications = async () => {
      if (user) {
        try {
          const userApplications = await applicationService.getUserApplications(user.uid);
          setApplications(userApplications);
        } catch (error) {
          console.error('Error fetching applications:', error);
        } finally {
          setLoadingApplications(false);
        }
      }
    }; // Removed else block as it's redundant with finally

    fetchApplications();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-[#ffb700] bg-[#fff7e6]';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmiyor';
    }
  };
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
        { name: 'Kargo Takip', tag: 'Ücretsiz', url: '/cargo-tracking' },
        { name: 'Not Hatırlatıcı', tag: 'Ücretsiz', url: '/notes' },
        { name: 'Takvim', tag: 'Ücretsiz', url: '/calendar' },
        { name: 'Bütçe Yönetimi', tag: 'Ücretsiz', url: '/expenses' },
        { name: 'Portföy Takibi', tag: 'Ücretsiz', url: '/portfolio' },
        { name: 'Dosyalarım', tag: 'Yeni', url: '/documents' },
        { name: 'AI Asistan', tag: 'Yeni', url: '/ai-assistant' },
        { name: 'Hizmet Başvuruları', tag: 'Yeni', url: '/services-list' }
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
        { name: 'Vergi Borcu Sorgulama', tag: 'GİB', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://ivd.gib.gov.tr/tvd_server/VergiDairesi' },
        { name: 'Trafik Cezası Sorgulama', tag: 'EGM', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-sorgulama' },
        { name: 'KYK Borcu Öde', tag: 'KYK', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://kyk.ziraatbank.com.tr' }
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
        { name: 'Trafik Sigortası', tag: 'Zorunlu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Kasko', tag: 'Popüler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'DASK', tag: 'Zorunlu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Konut Sigortası', tag: 'Önerilen', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Eşyam Güvende', tag: 'Yeni', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Yabancı Sağlık', tag: 'Özel', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/yabanci-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Ferdi Kaza', tag: 'Önerilen', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/ferdi-kaza-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Güvenli Cüzdan', tag: 'Yeni', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/guvenli-cuzdan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Fatura Koruma', tag: 'Avantajlı', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/fatura-koruma-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'Evcil Hayvan', tag: 'Popüler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/evcil-hayvan-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'İlk Ateş', tag: 'Özel', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/teklif-al/ilk-ates-sigortasi?reseller=${RESELLER_ID}` },
        { name: 'Seyahat Sağlık', tag: 'Gerekli', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/seyahat-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
        { name: 'IMM Sigortası', tag: 'Özel', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/imm-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
      ]
    },

    // 2. Fatura Ödemeleri (Temel ödemeler)
    {
      title: 'Fatura Ödemeleri',
      icon: <Receipt className="w-8 h-8" />,
      color: 'bg-[#ffb700]',
      bgColor: 'bg-[#fff7e6]',
      borderColor: 'border-[#ffe0b3]',
      textColor: 'text-[#ffb700]',
      services: [
        { name: 'EnerjiSA', tag: 'Elektrik', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'CK Enerji', tag: 'Elektrik', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İGDAŞ', tag: 'Doğalgaz', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'BAŞKENTGAZ', tag: 'Doğalgaz', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İSKİ', tag: 'Su', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'ASKİ', tag: 'Su', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Elektrik', tag: 'Tüm Şehirler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/elektrik-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Doğalgaz', tag: 'Tüm Şehirler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dogalgaz-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Diğer Su', tag: 'Tüm Şehirler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/su-faturasi-odeme.html?bayiid=${BAYI_ID}` }
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
        { name: 'Superonline', tag: 'Fiber', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.superonlineinternet.com/superonline_kampanyalari.html' },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: 'https://app.teknokapsul.info/yonlendirme.html?target=http://www.onlineabonelik.com/millenicom-kampanyalari.html' },
        { name: 'KabloNET', tag: 'Avantajlı', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.tumhizmetler.com/turksat-internet-kampanyalari.html' },
        { name: 'Extranet', tag: 'Ekonomik', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.tumhizmetler.com/extranet-internet-kampanyalari.html' },
        { name: 'Şoknet', tag: 'Taahhütsüz', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.tumhizmetler.com/soknet-kampanyalari.html' },
        { name: 'D-Smart', tag: 'TV+İnternet', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.smartabonelik.com.tr/bayi_online_basvuru.asp?urun=Dsmart&bayiid=${BAYI_ID}` },
        { name: 'Digitürk', tag: 'TV+İnternet', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.digiturkburada.com.tr/basvuru?refid=${REFID}` }
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
        { name: 'TOD TV', tag: 'Popüler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}` },
        { name: 'D-Smart GO', tag: 'Yeni', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
        { name: 'GAIN', tag: 'Trend', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
        { name: 'S Sport Plus', tag: 'Spor', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` },
        { name: 'Google Play', tag: 'Android', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
        { name: 'App Store', tag: 'iOS', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` },
        { name: 'BluTV', tag: 'Dizi', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/blutv-paketleri-mid-3?refid=${REFID}` },
        { name: 'Exxen', tag: 'Spor', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/exxen-paketleri-mid-12?refid=${REFID}` },
        { name: 'Netflix', tag: 'Film', url: `https://app.teknokapsul.info/yonlendirme.html?target=ttps://www.kodmarketim.com/netflix-paketleri-mid-13?refid=${REFID}` },
        { name: 'Spotify', tag: 'Müzik', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/spotify-paketleri-mid-14?refid=${REFID}` }
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
        { name: 'Valorant', tag: 'En Çok Satan', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}` },
        { name: 'League of Legends', tag: 'Popüler', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}` },
        { name: 'PUBG Mobile', tag: 'Trend', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}` },
        { name: 'Point Blank', tag: 'FPS', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
        { name: 'Zula', tag: 'Yerli', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` },
        { name: 'Wolfteam', tag: 'MMO', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` },
        { name: 'Bombom', tag: 'Sosyal', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/bombom-paketleri-mid-15?refid=${REFID}` },
        { name: 'Brawl Stars', tag: 'Mobil', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/brawl-stars-paketleri-mid-16?refid=${REFID}` },
        { name: 'Silkroad Online', tag: 'MMORPG', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/silkroad-paketleri-mid-17?refid=${REFID}` },
        { name: 'Steam Wallet', tag: 'PC', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/steam-paketleri-mid-18?refid=${REFID}` }
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
        { name: 'İSPARK Ödeme', tag: 'Park', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.ispark.istanbul/odeme' },
        { name: 'Trafik Cezası Ödeme', tag: 'Ceza', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-odeme' },
        { name: 'HGS Bakiye Yükleme', tag: 'Geçiş', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.hgs.com.tr/bakiye-yukleme' },
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
        { name: 'Ev Temizliği', tag: 'Standart', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` },
        { name: 'Ofis Temizliği', tag: 'Kurumsal', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Temizlik&bayiid=${BAYI_ID}` }
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
        { name: 'Dosyalarım', tag: 'Yeni', url: '/documents' },
        { name: 'E-İmza Başvurusu', tag: 'Kurumsal', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'KEP Adresi', tag: 'Resmi', url: 'https://basvuru.teknokapsul.com/apply/e_services' },
        { name: 'E-Fatura', tag: 'Ticari', url: 'https://basvuru.teknokapsul.com/apply/e_services' }
      ]
    }
  ];

  const handleServiceClick = (url: string) => {
    // Check if it's an internal route (starts with /)
    if (url.startsWith('/')) {
      // Navigate to internal route in the same tab
      window.location.href = url;
    } else {
      // Open external links in new tab
      window.open(url, '_blank');
    }
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

        {/* Success Message Display */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Başarılı!</strong>
            <span className="block sm:inline"> {successMessage}</span>
            {applicationNumber && (
              <span className="block sm:inline"> Başvuru Numaranız: <span className="font-bold">{applicationNumber}</span></span>
            )}
          </div>
        )}

        {/* Application Tracking Section */}
        {user && !loadingApplications && applications.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#ffb700] to-[#e6a600] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-semibold text-white">Başvuru Takibi</h2>
                  </div>
                  <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {applications.length} başvuru
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applications.slice(0, 6).map((application) => (
                    <div
                      key={application.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 hover:bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm mb-1">
                            {application.serviceName}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2">
                            Başvuru No: {application.applicationNumber}
                          </p>
                        </div>
                        <Eye 
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(application);
                            setShowModal(true);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span>{getStatusText(application.status)}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {application.createdAt instanceof Date 
                            ? application.createdAt.toLocaleDateString('tr-TR')
                            : new Date(application.createdAt).toLocaleDateString('tr-TR')
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {applications.length > 6 && (
                  <div className="mt-4 text-center">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Tüm başvuruları görüntüle ({applications.length - 6} daha)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Application Details Modal */}
        {showModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Başvuru Detayları
                </h3>
                <div className="w-12 h-1 bg-[#ffb700] rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Başvuru Numarası</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedApplication.applicationNumber}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Hizmet</label>
                  <p className="text-gray-900">{selectedApplication.serviceName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                    {getStatusIcon(selectedApplication.status)}
                    <span>{getStatusText(selectedApplication.status)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Başvuru Tarihi</label>
                  <p className="text-gray-900">
                    {selectedApplication.createdAt instanceof Date 
                      ? selectedApplication.createdAt.toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : new Date(selectedApplication.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                    }
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;