import React, { useState } from 'react';
import { 
  Calculator, CreditCard, Shield, Receipt, Search,
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
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-4 pt-5 pb-12">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-0.5">TeknoHizmet</h1>
              <p className="text-white/70 text-sm">200+ dijital hizmet tek yerde</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 shadow-lg">
              <p className="text-white font-bold text-2xl">{services.length}</p>
              <p className="text-white/60 text-[11px] uppercase tracking-wider mt-1">Hizmet</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 shadow-lg">
              <p className="text-white font-bold text-2xl">{categories.length - 1}</p>
              <p className="text-white/60 text-[11px] uppercase tracking-wider mt-1">Kategori</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 shadow-lg">
              <p className="text-white font-bold text-2xl">7/24</p>
              <p className="text-white/60 text-[11px] uppercase tracking-wider mt-1">Online</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/25 focus:border-white/40 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="page-content -mt-7 px-4">
        {/* Category Chips - horizontal scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 mb-5 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105' : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:scale-105'
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
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
              <h2 className="text-base font-bold text-foreground">Popüler Hizmetler</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
              {popular.slice(0, 8).map((s, i) => (
                <a
                  key={i}
                  href={isExternal(s.url) ? s.url : undefined}
                  onClick={!isExternal(s.url) ? (e) => { e.preventDefault(); navigate(s.url); } : undefined}
                  target={isExternal(s.url) ? '_blank' : undefined}
                  rel={isExternal(s.url) ? 'noopener noreferrer' : undefined}
                  className="flex-shrink-0 w-36 bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all active:scale-95 border border-gray-100"
                >
                  <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 mb-2 inline-block">{s.tag}</span>
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-2">{s.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] text-gray-500 font-medium">Popüler</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            {selectedCategory === 'all' ? 'Tüm Hizmetler' : categories.find(c => c.id === selectedCategory)?.label}
          </h2>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">{filtered.length} hizmet</span>
        </div>

        {/* Service List */}
        <div className="space-y-3 mb-6">
          {filtered.map((s, i) => (
            <a
              key={i}
              href={isExternal(s.url) ? s.url : undefined}
              onClick={!isExternal(s.url) ? (e) => { e.preventDefault(); navigate(s.url); } : undefined}
              target={isExternal(s.url) ? '_blank' : undefined}
              rel={isExternal(s.url) ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] border border-gray-100"
            >
              <div className={`w-11 h-11 rounded-xl ${categories.find(c => c.id === s.cat)?.color || 'bg-gray-50'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {(() => {
                  const CatIcon = categories.find(c => c.id === s.cat)?.icon || Sparkles;
                  const catText = categories.find(c => c.id === s.cat)?.text || 'text-gray-500';
                  return <CatIcon className={`w-5 h-5 ${catText}`} />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{s.name}</p>
                <span className="text-xs text-gray-500 font-medium">{s.tag}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.pop && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                {isExternal(s.url) ? (
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
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
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-5 mb-6 border border-emerald-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-1.5">Güvenli & Hızlı</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
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
