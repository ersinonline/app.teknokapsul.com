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
import { useLocation, useNavigate } from 'react-router-dom';

const Services = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
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

  // Filtreleme fonksiyonu
  const filterServiceGroups = (groups: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return groups;
    
    return groups.map(group => {
      const filteredServices = group.services.filter((service: any) => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        ...group,
        services: filteredServices
      };
    }).filter(group => group.services.length > 0);
  };
  
  const serviceGroups = [

    // 2. Hesaplama Araçları
    {
      title: 'Hesaplama Araçları',
      icon: <Calculator className="w-8 h-8" />,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      services: [
        { name: 'MTV Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama` },
        { name: 'Gelir Vergisi Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GelirVergisiHesaplama` },
        { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHasaplama-yi` },
        { name: 'Kasko Değer Listesi', tag: 'Bilgi', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` },
        { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHesaplama` },
        { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHesaplama_7440` },

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
        { name: 'Pasaport Bedeli Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/pasaportDegerliKagitBedeliOdeme` },
        { name: 'Diğer Harç Ödemeleri', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/digerHarcOdemeleri` },
        { name: 'MTV TPC Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
        { name: 'Cep Telefonu Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/cepTelefonuHarciOdeme` },
        { name: 'Sürücü Belgesi Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/surucuBelgesiHarciOdeme` },
        { name: 'Sürücü Belgesi Bedeli Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/surucuBelgesiDegerliKagitBedeliOdeme` },
        { name: 'TC Kimlik Kartı Bedeli Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/tcKimlikKartiBedeliOdeme` },
        { name: 'Yurtdışına Çıkış Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/yurtDisinaCikisHarciOdeme` },
        { name: 'Pasaport Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/pasaportHarciOdeme` },
        { name: 'Tapu Harcı Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/tapuHarciOdeme` },
        { name: 'KYK Ziraat Bankası', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://kyk.ziraatbank.com.tr` },
        { name: 'GİB Vergi Borcu Sorgu', tag: 'Sorgu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu` },
        { name: 'Araç Ceza Sorgulama', tag: 'Sorgu', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama` }
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
        { name: 'Turkcell Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Vodafone Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Türk Telekom Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-telefon-faturasi-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Digiturk Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/digiturk-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'D-Smart Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'KabloTV Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turksat-kablo-tv-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'TTNET Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-internet-ttnet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Turksat Kablonet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turksat-kablonet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Superonline Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-superonline-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Turknet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turknet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Millenicom Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/millenicom-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Vodafone İnternet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-internet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'D-Smart İnternet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-internet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Fibimnet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/fibimnet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Göknet Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/goknet-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İGDAŞ Doğalgaz Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/igdas-dogalgaz-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'AGDAŞ Doğalgaz Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/agdas-dogalgaz-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'Enerjisa Elektrik Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/enerjisa-istanbul-anadolu-elektrik-fatura-odeme.html?bayiid=${BAYI_ID}` },
        { name: 'İSKİ Fatura Ödeme', tag: 'Fatura', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/iski-fatura-odeme.html?bayiid=${BAYI_ID}` }
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
        { name: 'Superonline', tag: 'Fiber', url: '/application/superonline' },
        { name: 'Türk Telekom', tag: 'Fiber', url: '/application/turktelekom-internet' },
        { name: 'ExtraNET', tag: 'Fiber', url: '/application/extranet' },        
        { name: 'TeknosaNET', tag: 'Fiber', url: '/application/teknosanet' },
        { name: 'FibimNET', tag: 'Fiber', url: '/application/fibimnet' },
        { name: 'Millenicom', tag: 'Taahhütsüz', url: '/application/millenicom' },
        { name: 'KabloNET', tag: 'Avantajlı', url: '/application/kablonet' },
        { name: 'KabloTV', tag: 'Avantajlı', url: '/application/kablonet' },
        { name: 'Şoknet', tag: 'Taahhütsüz', url: '/application/soknet' },
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
        { name: 'Vodafone Numara Taşıma', tag: 'Popüler', url: '/application/vodafone' },
        { name: 'Vodafone Yeni Hat', tag: 'Yeni', url: '/application/vodafone' },
        { name: 'Turkcell Numara Taşıma', tag: 'Güvenilir', url: '/application/turkcell' },
        { name: 'Turkcell Yeni Hat', tag: 'Yeni', url: '/application/turkcell' },
        { name: 'Türk Telekom Numara Taşıma', tag: 'Ekonomik', url: '/application/turktelekom-gsm' },
        { name: 'Türk Telekom Yeni Hat', tag: 'Yeni', url: '/application/turktelekom-gsm' }
      ]
    },

    // 5. Dijital Hizmetler
    {
      title: 'Film Kodları',
      icon: <Tv className="w-8 h-8" />,
      color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
      services: [
        { name: 'Tod Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}` },
        { name: 'D-Smart Go Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
        { name: 'Gain Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
        { name: 'S Sport Plus Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` }
      ]
    },

    {
      title: 'Uygulama Kodları',
      icon: <Tv className="w-8 h-8" />,
      color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
      services: [
        { name: 'Google Play Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
        { name: 'Apple Store Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` }
      ]
    },

    // 6. Dijital Oyunlar
    {
      title: 'Oyun Kodları',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      services: [
        { name: 'League of Legends Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}` },
        { name: 'Point Blank Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
        { name: 'PUBG Mobile Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}` },
        { name: 'Razer Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/razer-paketleri-mid-18?refid=${REFID}` },
        { name: 'Valorant Point Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}` },
        { name: 'Roblox Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/roblox-paketleri-mid-24?refid=${REFID}` },
        { name: 'Microsoft Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/microsoft-paketleri-mid-25?refid=${REFID}` },
        { name: 'Garena Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/garena-paketleri-mid-26?refid=${REFID}` },
        { name: 'Gameforge Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gameforge-paketleri-mid-30?refid=${REFID}` },
        { name: 'Brawl Stars Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/brawl-stars-paketleri-mid-41?refid=${REFID}` },
        { name: 'Bombom Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/bombom-paketleri-mid-35?refid=${REFID}` },
        { name: 'Silkroad Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/silkroad-paketleri-mid-36?refid=${REFID}` },
        { name: 'Wolfteam Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` },
        { name: 'Wildstar Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/wildstar-paketleri-mid-38?refid=${REFID}` },
        { name: 'Blade and Soul Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/blade-and-soul-paketleri-mid-39?refid=${REFID}` },
        { name: 'Zula Paketleri', tag: 'Paket', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` }
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
        { name: 'iPhone Tamiri', tag: 'Apple', url: '/application/apple-service' },
        { name: 'iPad Tamiri', tag: 'Apple', url: '/application/apple-service' },
        { name: 'Apple Watch Tamiri', tag: 'Apple', url: '/application/apple-service' },
        { name: 'AirPods Tamiri', tag: 'Apple', url: '/application/apple-service' },
        { name: 'Samsung Tamiri', tag: 'Samsung', url: '/application/samsung-service' },
        { name: 'Xiaomi Tamiri', tag: 'Xiaomi', url: '/application/xiaomi-service' },
        { name: 'Huawei Tamiri', tag: 'Huawei', url: '/application/huawei-service' },
        { name: 'OPPO Tamiri', tag: 'OPPO', url: '/application/oppo-service' }
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
        { name: 'Kasko Değer Listesi', tag: 'Bilgi', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` },
        { name: 'MTV TPC Ödeme', tag: 'Ödeme', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
        { name: 'MTV Hesaplama', tag: 'Hesaplama', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama` },

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
        { name: 'Nakliyat Hizmetleri', tag: 'Ev Taşıma', url: '/application/nakliyat' },
        { name: 'Şehirler Arası Nakliyat', tag: 'Ev Taşıma', url: '/application/sehirlerarasi-nakliyat' },
        { name: 'Parça Eşya Taşıma', tag: 'Parça Eşya', url: '/application/parca-esya' },
        { name: 'Temizlik Hizmetleri', tag: 'Temizlik', url: '/application/temizlik' },
        { name: 'Ev Temizliği', tag: 'Ev Temizliği', url: '/application/ev-temizlik' },
        { name: 'Ofis Temizliği', tag: 'Ofis Temizliği', url: '/application/ofis-temizlik' },
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
        { name: 'E-İmza Başvurusu', tag: 'Dijital Çözümler', url: '/application/e-imza' },
        { name: 'KEP Adresi', tag: 'Dijital Çözümler', url: '/application/kep' },
        { name: 'E-Fatura', tag: 'Dijital Çözümler', url: '/application/e-fatura' },
      ]
    },

    // 🏡 Diğer Ev Hizmetleri
    {
      title: 'Diğer Ev Hizmetleri',
      icon: '🏡',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      services: [
        { name: 'İlaçlat Böcek İlaçlama', tag: 'Ev Hizmetleri', url: '/application/ilaclat' },
        { name: 'Kia Su Arıtma', tag: 'Ev Hizmetleri', url: '/application/kia-su' }
      ]
    },

    // 🔌 Elektrikli Araç Şarj İstasyonları
    {
      title: 'Elektrikli Araç Şarj İstasyonları',
      icon: '🔌',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      services: [
        { name: 'AC Şarj İstasyonu', tag: 'Şarj İstasyonları', url: '/application/ac-sarj' },
        { name: 'DC Şarj İstasyonu', tag: 'Şarj İstasyonları', url: '/application/dc-sarj' },
        { name: 'AC/DC Şarj İstasyonu', tag: 'Şarj İstasyonları', url: '/application/ac-dc-sarj' }
      ]
    },

    // 🛡️ Güvenlik Hizmetleri
    {
      title: 'Güvenlik Hizmetleri',
      icon: '🛡️',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      services: [
        { name: 'Pronet', tag: 'Güvenlik', url: '/application/pronet' },
        { name: 'Secom Güvenlik', tag: 'Güvenlik', url: '/application/secom' },
        { name: 'Kale Güvenlik', tag: 'Güvenlik', url: '/application/kale' }
      ]
    }
  ];

  const handleServiceClick = (url: string) => {
    // Check if it's an internal route (starts with /)
    if (url.startsWith('/')) {
      // Navigate to internal route using React Router
      navigate(url);
    } else {
      // Open external links in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-transparent rounded-b-lg">
        <div className="px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">🛠️ TeknoHizmet</h1>
          <p className="text-gray-600 mt-2 text-lg">Teknolojik hizmetleriniz</p>
          <br></br>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hizmet ara... (örn: fatura ödeme, kasko yaptırma)"
                className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffb700] focus:border-transparent shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 -mt-4">
        <div className="max-w-7xl mx-auto">

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
          {filterServiceGroups(serviceGroups, searchTerm).length === 0 && searchTerm.trim() ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Arama sonucu bulunamadı</h3>
              <p className="text-gray-500 mb-4">"<span className="font-medium">{searchTerm}</span>" için herhangi bir hizmet bulunamadı.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-[#ffb700] hover:text-[#e6a600] font-medium"
              >
                Aramayı temizle
              </button>
            </div>
          ) : (
            filterServiceGroups(serviceGroups, searchTerm).map((group, groupIndex) => (
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
                {group.services.map((service: any, serviceIndex: number) => (
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
              {groupIndex < filterServiceGroups(serviceGroups, searchTerm).length - 1 && (
                <div className="border-t border-gray-200 mt-8"></div>
              )}
            </div>
          ))
          )}
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
        )}        </div>
      </div>
    </div>
  );
};

export default Services;