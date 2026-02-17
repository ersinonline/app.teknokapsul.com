import React, { useState } from 'react';
import { 
  Calculator, CreditCard, Shield, Receipt, Tv, Gamepad2, Search,
  ExternalLink, Star, Zap, Wifi, Smartphone, Wrench, Truck,
  Building, ArrowLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RESELLER_ID = "123456";
const REFID = "54108";
const BAYI_ID = "54108";

const categories = [
  { id: 'all', label: 'Tümü', icon: Sparkles, color: 'bg-gray-100', text: 'text-gray-700' },
  { id: 'calculations', label: 'Hesaplama', icon: Calculator, color: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'debt-inquiry', label: 'Borç Sorgu', icon: CreditCard, color: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'insurance', label: 'Sigorta', icon: Shield, color: 'bg-green-50', text: 'text-green-700' },
  { id: 'bill-payments', label: 'Fatura', icon: Receipt, color: 'bg-orange-50', text: 'text-orange-700' },
  { id: 'entertainment', label: 'Eğlence', icon: Tv, color: 'bg-purple-50', text: 'text-purple-700' },
  { id: 'game-codes', label: 'Oyun', icon: Gamepad2, color: 'bg-pink-50', text: 'text-pink-700' },
  { id: 'gsm', label: 'GSM', icon: Smartphone, color: 'bg-red-50', text: 'text-red-700' },
  { id: 'vehicle', label: 'Araç', icon: Truck, color: 'bg-slate-50', text: 'text-slate-700' },
  { id: 'internet-tv', label: 'İnternet', icon: Wifi, color: 'bg-indigo-50', text: 'text-indigo-700' },
  { id: 'technical', label: 'Teknik', icon: Wrench, color: 'bg-orange-50', text: 'text-orange-700' },
  { id: 'e-services', label: 'E-Hizmet', icon: Building, color: 'bg-cyan-50', text: 'text-cyan-700' },
  { id: 'other', label: 'Diğer', icon: Zap, color: 'bg-teal-50', text: 'text-teal-700' },
];

const services = [
  // Hesaplama
  { name: 'MTV Hesaplama', tag: 'Hesaplama', cat: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/MTVHesaplama`, pop: true },
  { name: 'Gelir Vergisi Hesaplama', tag: 'Hesaplama', cat: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GelirVergisiHesaplama` },
  { name: 'Gecikme Zam ve Faiz', tag: 'Hesaplama', cat: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hesaplamalar/GecikmeZamVeFaizHesaplama` },
  { name: 'Kasko Değer Listesi', tag: 'Bilgi', cat: 'calculations', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/kasko-deger-listesi` },
  // Borç Sorgulama
  { name: 'Pasaport Bedeli Ödeme', tag: 'Ödeme', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/pasaportDegerliKagitBedeliOdeme`, pop: true },
  { name: 'MTV TPC Ödeme', tag: 'Ödeme', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/MTVTPCOdeme` },
  { name: 'Cep Telefonu Harcı', tag: 'Ödeme', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/cepTelefonuHarciOdeme` },
  { name: 'Sürücü Belgesi Harcı', tag: 'Ödeme', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/surucuBelgesiHarciOdeme` },
  { name: 'Diğer Harç Ödemeleri', tag: 'Ödeme', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://dijital.gib.gov.tr/hizliOdemeler/digerHarcOdemeleri` },
  { name: 'GİB Vergi Borcu Sorgu', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/gib-vergi-borcu-sorgu`, pop: true },
  { name: 'Araç Ceza Sorgulama', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama` },
  { name: 'SGK Prim Borcu', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/sgk-prim-borcu-sorgulama` },
  { name: 'İcra Borcu Sorgulama', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/icra-borcu-sorgulama` },
  { name: 'Trafik Cezası Sorgulama', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-sorgulama` },
  { name: 'Belediye Borcu', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/belediye-borcu-sorgulama` },
  { name: 'Emlak Vergisi', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/emlak-vergisi-sorgulama` },
  { name: 'Su Faturası Sorgu', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/su-faturasi-sorgulama` },
  { name: 'Doğalgaz Faturası', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/dogalgaz-faturasi-sorgulama` },
  { name: 'Elektrik Faturası', tag: 'Sorgu', cat: 'debt-inquiry', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/elektrik-faturasi-sorgulama` },
  // Sigorta
  { name: 'Trafik Sigortası', tag: 'Zorunlu', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/trafik-sigortasi-teklif-al?reseller=${RESELLER_ID}`, pop: true },
  { name: 'Kasko Sigortası', tag: 'Popüler', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/kasko-sigortasi-teklif-al?reseller=${RESELLER_ID}`, pop: true },
  { name: 'DASK', tag: 'Zorunlu', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/dask-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
  { name: 'Konut Sigortası', tag: 'Önerilen', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/konut-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
  { name: 'Eşyam Güvende', tag: 'Yeni', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/esyam-guvende-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
  { name: 'Tamamlayıcı Sağlık', tag: 'Avantajlı', cat: 'insurance', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://gelsinteklif.sigortayeri.com/tamamlayici-saglik-sigortasi-teklif-al?reseller=${RESELLER_ID}` },
  // Fatura
  { name: 'Turkcell Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-fatura-odeme.html?bayiid=${BAYI_ID}`, pop: true },
  { name: 'Vodafone Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/vodafone-fatura-odeme.html?bayiid=${BAYI_ID}`, pop: true },
  { name: 'Türk Telekom Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-telefon-faturasi-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'Digiturk Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/digiturk-fatura-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'D-Smart Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/dsmart-fatura-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'TTNET Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turk-telekom-internet-ttnet-fatura-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'Superonline Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turkcell-superonline-fatura-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'Turknet Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turknet-fatura-odeme.html?bayiid=${BAYI_ID}` },
  { name: 'Kablonet Fatura', tag: 'Fatura', cat: 'bill-payments', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.faturago.com.tr/turksat-kablonet-fatura-odeme.html?bayiid=${BAYI_ID}` },
  // Eğlence
  { name: 'TOD Paketleri', tag: 'Dijital', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/tod-paketleri-mid-1?refid=${REFID}`, pop: true },
  { name: 'D-Smart GO', tag: 'Dijital', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/d-smart-go-paketleri-mid-2?refid=${REFID}` },
  { name: 'Gain Paketleri', tag: 'Dijital', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/gain-paketleri-mid-11?refid=${REFID}` },
  { name: 'S Sport Plus', tag: 'Dijital', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/s-sport-plus-paketleri-mid-33?refid=${REFID}` },
  { name: 'Google Play', tag: 'Kod', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/google-play-paketleri-mid-4?refid=${REFID}` },
  { name: 'Apple Store', tag: 'Kod', cat: 'entertainment', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/apple-store-paketleri-mid-5?refid=${REFID}` },
  // Oyun Kodları
  { name: 'League of Legends', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/league-of-legends-paketleri-mid-6?refid=${REFID}`, pop: true },
  { name: 'PUBG Mobile', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/pubg-mobile-paketleri-mid-10?refid=${REFID}`, pop: true },
  { name: 'Valorant Point', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/valorant-point-paketleri-mid-22?refid=${REFID}`, pop: true },
  { name: 'Roblox', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/roblox-paketleri-mid-24?refid=${REFID}` },
  { name: 'Brawl Stars', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/brawl-stars-paketleri-mid-41?refid=${REFID}` },
  { name: 'Point Blank', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/point-blank-paketleri-mid-8?refid=${REFID}` },
  { name: 'Microsoft', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/microsoft-paketleri-mid-25?refid=${REFID}` },
  { name: 'Zula', tag: 'Oyun', cat: 'game-codes', url: `https://app.teknokapsul.info/yonlendirme.html?target=https://www.kodmarketim.com/zula-paketleri-mid-7?refid=${REFID}` },
  // GSM
  { name: 'Vodafone Numara Taşıma', tag: 'Popüler', cat: 'gsm', url: '/application/vodafone', pop: true },
  { name: 'Vodafone Yeni Hat', tag: 'Yeni', cat: 'gsm', url: '/application/vodafone' },
  { name: 'Turkcell Numara Taşıma', tag: 'Güvenilir', cat: 'gsm', url: '/application/turkcell', pop: true },
  { name: 'Turkcell Yeni Hat', tag: 'Yeni', cat: 'gsm', url: '/application/turkcell' },
  { name: 'Türk Telekom Numara Taşıma', tag: 'Ekonomik', cat: 'gsm', url: '/application/turktelekom-gsm' },
  { name: 'Türk Telekom Yeni Hat', tag: 'Yeni', cat: 'gsm', url: '/application/turktelekom-gsm' },
  // Araç
  { name: 'İSPARK Ödeme', tag: 'Park', cat: 'vehicle', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.ispark.istanbul/odeme', pop: true },
  { name: 'Trafik Cezası Ödeme', tag: 'Ceza', cat: 'vehicle', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.turkiye.gov.tr/trafik-cezasi-odeme' },
  { name: 'HGS Bakiye Yükleme', tag: 'Geçiş', cat: 'vehicle', url: 'https://app.teknokapsul.info/yonlendirme.html?target=https://www.hgs.com.tr/bakiye-yukleme' },
  // Teknik Servis
  { name: 'iPhone Tamiri', tag: 'Apple', cat: 'technical', url: '/application/apple-service', pop: true },
  { name: 'iPad Tamiri', tag: 'Apple', cat: 'technical', url: '/application/apple-service' },
  { name: 'Samsung Tamiri', tag: 'Samsung', cat: 'technical', url: '/application/samsung-service' },
  { name: 'Xiaomi Tamiri', tag: 'Xiaomi', cat: 'technical', url: '/application/xiaomi-service' },
  { name: 'Huawei Tamiri', tag: 'Huawei', cat: 'technical', url: '/application/huawei-service' },
  // E-Hizmetler
  { name: 'E-İmza Başvurusu', tag: 'Dijital', cat: 'e-services', url: '/application/e-imza', pop: true },
  { name: 'KEP Adresi', tag: 'Dijital', cat: 'e-services', url: '/application/kep' },
  { name: 'E-Fatura', tag: 'Dijital', cat: 'e-services', url: '/application/e-fatura' },
  // Diğer
  { name: 'Nakliyat Hizmetleri', tag: 'Taşıma', cat: 'other', url: '/application/nakliyat', pop: true },
  { name: 'Ev Temizliği', tag: 'Temizlik', cat: 'other', url: '/application/ev-temizlik' },
  { name: 'Böcek İlaçlama', tag: 'Ev', cat: 'other', url: '/application/ilaclat' },
  { name: 'Su Arıtma', tag: 'Ev', cat: 'other', url: '/application/kia-su' },
  { name: 'AC Şarj İstasyonu', tag: 'EV Şarj', cat: 'other', url: '/application/ac-sarj' },
  { name: 'Pronet Güvenlik', tag: 'Güvenlik', cat: 'other', url: '/application/pronet' },
];

const TeknoHizmetPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = services.filter(s => {
    const matchCat = selectedCategory === 'all' || s.cat === selectedCategory;
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.tag.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const popular = services.filter(s => s.pop);
  const isExternal = (url: string) => url.startsWith('http');

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">TeknoHizmet</h1>
              <p className="text-white/60 text-xs">200+ dijital hizmet tek yerde</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{services.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Hizmet</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{categories.length - 1}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Kategori</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">7/24</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Online</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:bg-white/15"
            />
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 px-4">
        {/* Category Chips - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  active ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Popular - only when no filter */}
        {!searchTerm && selectedCategory === 'all' && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Popüler Hizmetler</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {popular.slice(0, 8).map((s, i) => (
                <a
                  key={i}
                  href={isExternal(s.url) ? s.url : undefined}
                  onClick={!isExternal(s.url) ? (e) => { e.preventDefault(); navigate(s.url); } : undefined}
                  target={isExternal(s.url) ? '_blank' : undefined}
                  rel={isExternal(s.url) ? 'noopener noreferrer' : undefined}
                  className="flex-shrink-0 w-32 bank-card p-3 hover:shadow-md transition-all active:scale-[0.97]"
                >
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 mb-2 inline-block">{s.tag}</span>
                  <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">{s.name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                    <span className="text-[9px] text-muted-foreground">Popüler</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {selectedCategory === 'all' ? 'Tüm Hizmetler' : categories.find(c => c.id === selectedCategory)?.label}
          </h2>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} hizmet</span>
        </div>

        {/* Service List */}
        <div className="space-y-2 mb-6">
          {filtered.map((s, i) => (
            <a
              key={i}
              href={isExternal(s.url) ? s.url : undefined}
              onClick={!isExternal(s.url) ? (e) => { e.preventDefault(); navigate(s.url); } : undefined}
              target={isExternal(s.url) ? '_blank' : undefined}
              rel={isExternal(s.url) ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 bank-card p-3 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className={`w-9 h-9 rounded-lg ${categories.find(c => c.id === s.cat)?.color || 'bg-gray-50'} flex items-center justify-center flex-shrink-0`}>
                {(() => {
                  const CatIcon = categories.find(c => c.id === s.cat)?.icon || Sparkles;
                  const catText = categories.find(c => c.id === s.cat)?.text || 'text-gray-500';
                  return <CatIcon className={`w-4 h-4 ${catText}`} />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <span className="text-[10px] text-muted-foreground">{s.tag}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {s.pop && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                {isExternal(s.url) ? (
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aramanızla eşleşen hizmet bulunamadı.</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bank-card p-4 mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Güvenli & Hızlı</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tüm hizmetler güvenli bağlantılar üzerinden sunulmaktadır. 7/24 online erişim.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoHizmetPage;
