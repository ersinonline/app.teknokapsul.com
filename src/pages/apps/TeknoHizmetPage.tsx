import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CreditCard, 
  Shield, 
  Receipt, 
  Tv, 
  Gamepad2, 
  Search, 
  Filter,
  ArrowRight,
  ExternalLink,
  Star,
  Zap,
  Clock,
  Users,
  Wifi,
  Smartphone,
  Wrench,
  Truck,
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/application.service';
import { Application } from '../../types/application';
import { useLocation } from 'react-router-dom';

const TeknoHizmetPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { applicationNumber, successMessage } = location.state || {};
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Reseller ve Bayi ID'leri
  const RESELLER_ID = "123456";
  const REFID = "54108";
  const BAYI_ID = "54108";

  // Kategori tanımları
  const categories = [
    {
      id: 'all',
      title: 'Tümü',
      description: 'Tüm hizmetleri görüntüle',
      icon: Filter,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    },
    {
      id: 'calculations',
      title: 'Hesaplama Araçları',
      description: 'Vergi, MTV ve diğer hesaplamalar',
      icon: Calculator,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'debt-inquiry',
      title: 'Borç Sorgulama',
      description: 'Vergi borcu sorgulama ve hızlı ödemeler',
      icon: CreditCard,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    {
      id: 'insurance',
      title: 'Sigortalar',
      description: 'Trafik, kasko ve diğer sigorta türleri',
      icon: Shield,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'bill-payments',
      title: 'Fatura Ödemeleri',
      description: 'Telefon, internet ve diğer fatura ödemeleri',
      icon: Receipt,
      color: 'bg-[#ffb700]',
      bgColor: 'bg-[#fff7e6]',
      textColor: 'text-[#ffb700]'
    },
    {
      id: 'internet-tv',
      title: 'İnternet & TV',
      description: 'İnternet ve TV hizmetleri',
      icon: Wifi,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      id: 'gsm',
      title: 'GSM Operatörleri',
      description: 'Mobil hat ve numara taşıma hizmetleri',
      icon: Smartphone,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      id: 'entertainment',
      title: 'Film Kodları',
      description: 'Film, uygulama kodları',
      icon: Tv,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'app-codes',
      title: 'Uygulama Kodları',
      description: 'Google Play, Apple Store kodları',
      icon: Tv,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'game-codes',
      title: 'Oyun Kodları',
      description: 'League of Legends, PUBG, Valorant ve diğer oyun paketleri',
      icon: Gamepad2,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700'
    },
    {
      id: 'technical-service',
      title: 'Teknik Servis',
      description: 'Telefon ve cihaz tamiri hizmetleri',
      icon: Wrench,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      id: 'vehicle-services',
      title: 'Taşıt Hizmetleri',
      description: 'Park, ceza ve geçiş hizmetleri',
      icon: Truck,
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700'
    },
    {
      id: 'transport-services',
      title: 'Nakliyat Hizmetleri',
      description: 'Ev taşıma ve temizlik hizmetleri',
      icon: Truck,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    },
    {
      id: 'e-services',
      title: 'E-Hizmetler',
      description: 'E-imza, KEP ve dijital çözümler',
      icon: Building,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700'
    },
    {
      id: 'home-services',
      title: 'Diğer Ev Hizmetleri',
      description: 'Böcek ilaçlama ve su arıtma',
      icon: Building,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'charging-stations',
      title: 'Elektrikli Araç Şarj İstasyonları',
      description: 'AC ve DC şarj istasyonları',
      icon: Zap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'security-services',
      title: 'Güvenlik Hizmetleri',
      description: 'Güvenlik sistemleri ve hizmetleri',
      icon: Shield,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  // Kategori hizmetleri - Services sayfasından entegre edildi
  const categoryServices: { [key: string]: any[] } = {
    'calculations': [
      { name: 'MTV Hesaplama', tag: 'Hesaplama', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama`, popular: true },
      { name: 'Gelir Vergisi Hesaplama', tag: 'Hesaplama', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GelirVergisiHesaplama` },
      { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHasaplama-yi` },
      { name: 'Kasko Değer Listesi', tag: 'Bilgi', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` },
      { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHesaplama` },
      { name: 'Gecikme Zam ve Faiz Hesaplama', tag: 'Hesaplama', category: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHesaplama_7440` }
    ],
    'debt-inquiry': [
      { name: 'Pasaport Bedeli Ödeme', tag: 'Ödeme', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/pasaportDegerliKagitBedeliOdeme`, popular: true },
      { name: 'Diğer Harç Ödemeleri', tag: 'Ödeme', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/digerHarcOdemeleri` },
      { name: 'MTV TPC Ödeme', tag: 'Ödeme', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
      { name: 'Cep Telefonu Harcı Ödeme', tag: 'Ödeme', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/cepTelefonuHarciOdeme` },
      { name: 'Sürücü Belgesi Harcı Ödeme', tag: 'Ödeme', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/surucuBelgesiHarciOdeme` },
      { name: 'GİB Vergi Borcu Sorgu', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu`, popular: true },
      { name: 'Araç Ceza Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama` },
      { name: 'Vergi Borcu Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu` },
      { name: 'SGK Prim Borcu Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/sgk-prim-borcu-sorgulama` },
      { name: 'İcra Borcu Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/icra-borcu-sorgulama` },
      { name: 'Trafik Cezası Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-sorgulama` },
      { name: 'Belediye Borcu Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/belediye-borcu-sorgulama` },
      { name: 'Emlak Vergisi Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emlak-vergisi-sorgulama` },
      { name: 'Çevre Temizlik Vergisi Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/cevre-temizlik-vergisi-sorgulama` },
      { name: 'Su Faturası Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/su-faturasi-sorgulama` },
      { name: 'Doğalgaz Faturası Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/dogalgaz-faturasi-sorgulama` },
      { name: 'Elektrik Faturası Sorgulama', tag: 'Sorgu', category: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/elektrik-faturasi-sorgulama` }
    ],
    'insurance': [
      { name: 'Trafik Sigortası', tag: 'Zorunlu', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}`, popular: true },
      { name: 'Kasko', tag: 'Popüler', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}`, popular: true },
      { name: 'DASK', tag: 'Zorunlu', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Konut Sigortası', tag: 'Önerilen', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Eşyam Güvende', tag: 'Yeni', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
      { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', category: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` }
    ],
    'bill-payments': [
      { name: 'Turkcell Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-fatura-odeme.html?bayiid=${BAYI_ID}`, popular: true },
      { name: 'Vodafone Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-fatura-odeme.html?bayiid=${BAYI_ID}`, popular: true },
      { name: 'Türk Telekom Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-telefon-faturasi-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Digiturk Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/digiturk-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'D-Smart Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'TTNET Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-internet-ttnet-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Turksat Kablonet Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turksat-kablonet-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Superonline Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-superonline-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Turknet Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turknet-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Millenicom Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/millenicom-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'Vodafone İnternet Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-internet-fatura-odeme.html?bayiid=${BAYI_ID}` },
      { name: 'D-Smart İnternet Fatura Ödeme', tag: 'Fatura', category: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-internet-fatura-odeme.html?bayiid=${BAYI_ID}` }
    ],
    'gsm-operators': [
      { name: 'Vodafone Numara Taşıma', tag: 'Popüler', category: 'gsm-operators', url: '/application/vodafone', popular: true },
      { name: 'Vodafone Yeni Hat', tag: 'Yeni', category: 'gsm-operators', url: '/application/vodafone' },
      { name: 'Turkcell Numara Taşıma', tag: 'Güvenilir', category: 'gsm-operators', url: '/application/turkcell', popular: true },
      { name: 'Turkcell Yeni Hat', tag: 'Yeni', category: 'gsm-operators', url: '/application/turkcell' },
      { name: 'Türk Telekom Numara Taşıma', tag: 'Ekonomik', category: 'gsm-operators', url: '/application/turktelekom-gsm' },
      { name: 'Türk Telekom Yeni Hat', tag: 'Yeni', category: 'gsm-operators', url: '/application/turktelekom-gsm' }
    ],
    'entertainment': [
      { name: 'Tod Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}`, popular: true },
      { name: 'D-Smart Go Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
      { name: 'Gain Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
      { name: 'S Sport Plus Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` },
      { name: 'Google Play Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
      { name: 'Apple Store Paketleri', tag: 'Paket', category: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` }
    ],
    'game-codes': [
      { name: 'League of Legends Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}`, popular: true },
      { name: 'Point Blank Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
      { name: 'PUBG Mobile Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}`, popular: true },
      { name: 'Razer Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/razer-paketleri-mid-18?refid=${REFID}` },
      { name: 'Valorant Point Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}`, popular: true },
      { name: 'Roblox Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/roblox-paketleri-mid-24?refid=${REFID}` },
      { name: 'Microsoft Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/microsoft-paketleri-mid-25?refid=${REFID}` },
      { name: 'Garena Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/garena-paketleri-mid-26?refid=${REFID}` },
      { name: 'Gameforge Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gameforge-paketleri-mid-30?refid=${REFID}` },
      { name: 'Brawl Stars Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/brawl-stars-paketleri-mid-41?refid=${REFID}` },
      { name: 'Bombom Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/bombom-paketleri-mid-35?refid=${REFID}` },
      { name: 'Silkroad Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/silkroad-paketleri-mid-36?refid=${REFID}` },
      { name: 'Wolfteam Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/wolfteam-paketleri-mid-37?refid=${REFID}` },
      { name: 'Wildstar Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/wildstar-paketleri-mid-38?refid=${REFID}` },
      { name: 'Blade and Soul Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/blade-and-soul-paketleri-mid-39?refid=${REFID}` },
      { name: 'Zula Paketleri', tag: 'Paket', category: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` }
    ],
    'technical-service': [
      { name: 'iPhone Tamiri', tag: 'Apple', category: 'technical-service', url: '/application/apple-service', popular: true },
      { name: 'iPad Tamiri', tag: 'Apple', category: 'technical-service', url: '/application/apple-service' },
      { name: 'Apple Watch Tamiri', tag: 'Apple', category: 'technical-service', url: '/application/apple-service' },
      { name: 'AirPods Tamiri', tag: 'Apple', category: 'technical-service', url: '/application/apple-service' },
      { name: 'Samsung Tamiri', tag: 'Samsung', category: 'technical-service', url: '/application/samsung-service' },
      { name: 'Xiaomi Tamiri', tag: 'Xiaomi', category: 'technical-service', url: '/application/xiaomi-service' },
      { name: 'Huawei Tamiri', tag: 'Huawei', category: 'technical-service', url: '/application/huawei-service' },
      { name: 'OPPO Tamiri', tag: 'OPPO', category: 'technical-service', url: '/application/oppo-service' }
    ],
    'vehicle-services': [
      { name: 'İSPARK Ödeme', tag: 'Park', category: 'vehicle-services', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.ispark.istanbul/odeme', popular: true },
      { name: 'Trafik Cezası Ödeme', tag: 'Ceza', category: 'vehicle-services', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-odeme' },
      { name: 'HGS Bakiye Yükleme', tag: 'Geçiş', category: 'vehicle-services', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.hgs.com.tr/bakiye-yukleme' },
      { name: 'Kasko Değer Listesi', tag: 'Bilgi', category: 'vehicle-services', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` },
      { name: 'MTV TPC Ödeme', tag: 'Ödeme', category: 'vehicle-services', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
      { name: 'MTV Hesaplama', tag: 'Hesaplama', category: 'vehicle-services', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama` }
    ],
    'transportation-services': [
      { name: 'Nakliyat Hizmetleri', tag: 'Ev Taşıma', category: 'transportation-services', url: '/application/nakliyat', popular: true },
      { name: 'Şehirler Arası Nakliyat', tag: 'Ev Taşıma', category: 'transportation-services', url: '/application/sehirlerarasi-nakliyat' },
      { name: 'Parça Eşya Taşıma', tag: 'Parça Eşya', category: 'transportation-services', url: '/application/parca-esya' },
      { name: 'Temizlik Hizmetleri', tag: 'Temizlik', category: 'transportation-services', url: '/application/temizlik' },
      { name: 'Ev Temizliği', tag: 'Ev Temizliği', category: 'transportation-services', url: '/application/ev-temizlik' },
      { name: 'Ofis Temizliği', tag: 'Ofis Temizliği', category: 'transportation-services', url: '/application/ofis-temizlik' }
    ],
    'e-services': [
      { name: 'E-İmza Başvurusu', tag: 'Dijital Çözümler', category: 'e-services', url: '/application/e-imza', popular: true },
      { name: 'KEP Adresi', tag: 'Dijital Çözümler', category: 'e-services', url: '/application/kep' },
      { name: 'E-Fatura', tag: 'Dijital Çözümler', category: 'e-services', url: '/application/e-fatura' }
    ],
    'other-home-services': [
      { name: 'İlaçlat Böcek İlaçlama', tag: 'Ev Hizmetleri', category: 'other-home-services', url: '/application/ilaclat', popular: true },
      { name: 'Kia Su Arıtma', tag: 'Ev Hizmetleri', category: 'other-home-services', url: '/application/kia-su' }
    ],
    'electric-vehicle-charging': [
      { name: 'AC Şarj İstasyonu', tag: 'Şarj İstasyonları', category: 'electric-vehicle-charging', url: '/application/ac-sarj', popular: true },
      { name: 'DC Şarj İstasyonu', tag: 'Şarj İstasyonları', category: 'electric-vehicle-charging', url: '/application/dc-sarj' },
      { name: 'AC/DC Şarj İstasyonu', tag: 'Şarj İstasyonları', category: 'electric-vehicle-charging', url: '/application/ac-dc-sarj' }
    ],
    'security-services': [
      { name: 'Pronet', tag: 'Güvenlik', category: 'security-services', url: '/application/pronet', popular: true },
      { name: 'Secom Güvenlik', tag: 'Güvenlik', category: 'security-services', url: '/application/secom' },
      { name: 'Kale Güvenlik', tag: 'Güvenlik', category: 'security-services', url: '/application/kale' }
    ]
  };

  // Tüm hizmetleri birleştir
  const allServices = Object.values(categoryServices).flat();

  // Filtrelenmiş hizmetler
  const filteredServices = selectedCategory === 'all' 
    ? allServices.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categoryServices[selectedCategory]?.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.tag.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

  // Popüler hizmetler
  const popularServices = allServices.filter(service => service.popular);

  // Başvuru takibi için useEffect
  useEffect(() => {
    const fetchApplications = async () => {
      if (user) {
        try {
          const userApplications = await applicationService.getUserApplications(user.id);
          setApplications(userApplications);
        } catch (error) {
          console.error('Error fetching applications:', error);
        } finally {
          setLoadingApplications(false);
        }
      } else {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Başvuru durumu fonksiyonları
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

  const stats = [
    { icon: Zap, title: '200+', subtitle: 'Hizmet' },
    { icon: Users, title: '50K+', subtitle: 'Kullanıcı' },
    { icon: Clock, title: '7/24', subtitle: 'Destek' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">TeknoHizmet</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Günlük işlemlerinizi kolaylaştıran dijital hizmetler. Vergi hesaplamalarından sigorta işlemlerine kadar her şey burada.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <div className="bg-[#ffb700]/10 p-2 rounded-lg w-fit mx-auto mb-2">
                  <Icon className="w-6 h-6 text-[#ffb700]" />
                </div>
                <div className="text-xl font-bold text-gray-900">{stat.title}</div>
                <div className="text-sm text-gray-600">{stat.subtitle}</div>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
            />
          </div>
        </div>

        {/* Success Message */}
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

        {/* Popular Services */}
        {searchTerm === '' && selectedCategory === 'all' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#ffb700]" />
              Popüler Hizmetler
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularServices.slice(0, 6).map((service, index) => (
                <a
                  key={index}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#ffb700] hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#ffb700]/10 text-[#ffb700] px-2 py-1 rounded-full text-xs font-medium">
                      {service.tag}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-500">Popüler</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                    isActive 
                      ? 'border-[#ffb700] bg-[#ffb700]/10 text-[#ffb700]' 
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-[#ffb700]/20' : category.bgColor}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#ffb700]' : category.textColor}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{category.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCategory === 'all' ? 'Tüm Hizmetler' : categories.find(c => c.id === selectedCategory)?.title}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredServices.length} hizmet bulundu
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service, index) => (
              <a
                key={index}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#ffb700] hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {service.tag}
                  </span>
                  <div className="flex items-center gap-1">
                    {service.popular && (
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    )}
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{service.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Hemen Başla</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                </div>
              </a>
            ))}
          </div>
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Hizmet bulunamadı</h3>
              <p className="text-gray-500">Arama kriterlerinizi değiştirmeyi deneyin.</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Güvenli & Hızlı</h3>
            </div>
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              Tüm hizmetlerimiz güvenli bağlantılar üzerinden sunulmaktadır. 
              Resmi kurumların web sitelerine yönlendirilerek işlemlerinizi güvenle gerçekleştirebilirsiniz.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">SSL Güvenlik</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Hızlı İşlem</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">7/24 Erişim</span>
              </div>
            </div>
          </div>
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

export default TeknoHizmetPage;