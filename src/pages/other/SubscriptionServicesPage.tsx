import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Wifi, CreditCard, Tv, Monitor, Play, Smartphone, Gamepad2, Shield, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  url: string;
  badge?: string;
  category: 'internet' | 'tv' | 'dijital' | 'finans';
}

const services: ServiceItem[] = [
  {
    id: 'goknet',
    title: 'Göknet İnternet',
    description: 'Türkiye genelinde uygun fiyatlı internet paketleri için online başvuru yapın.',
    icon: Wifi,
    color: 'bg-sky-500',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    url: 'https://www.tumhizmetler.com/bayi/bayi_online_basvuru.asp?urun=Goknet&bayiid=54108',
    badge: 'İnternet',
    category: 'internet',
  },
  {
    id: 'fatura',
    title: 'Fatura Ödeme Merkezi',
    description: 'Telefon, internet, TV, elektrik, doğalgaz ve su faturalarınızı hızlı ve güvenli ödeyin.',
    icon: CreditCard,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    url: 'https://www.faturaodemex.com.tr/hizli-fatura-odeme.html?bayiid=54108',
    badge: 'Fatura',
    category: 'finans',
  },
  {
    id: 'dsmart',
    title: 'D-Smart TV & İnternet',
    description: 'D-Smart TV ve internet kampanyalarına özel fiyatlarla hemen başvuru yapın.',
    icon: Tv,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    url: 'https://www.smartabonelik.com.tr/bayi_online_basvuru.asp?urun=Dsmart&bayiid=54108',
    badge: 'TV & İnternet',
    category: 'tv',
  },
  {
    id: 'digiturk',
    title: 'Digiturk & Cihaz Kampanyaları',
    description: 'Digiturk TV paketleri ve kampanyalı cihaz fırsatları için online başvuru yapın.',
    icon: Monitor,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    url: 'https://www.digiturkburada.com.tr/basvuru?refid=54108',
    badge: 'TV',
    category: 'tv',
  },
  {
    id: 'tod',
    title: 'TOD Paketleri',
    description: 'Spor ve eğlence içeriklerini internet üzerinden izlemek için TOD\'a abone olun.',
    icon: Play,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    url: 'https://www.digiturkburada.com.tr/tod-paketleri.html?refid=54108',
    badge: 'Dijital Yayın',
    category: 'dijital',
  },
  {
    id: 'dsmartgo',
    title: 'D-Smart GO',
    description: 'D-Smart içeriklerini internet üzerinden izlemek için dijital paket başvurusu yapın.',
    icon: Smartphone,
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    url: 'https://www.smartabonelik.com.tr/dsmart-go-paketleri.html?refid=54108',
    badge: 'Dijital Yayın',
    category: 'dijital',
  },
  {
    id: 'kodmarketim',
    title: 'Dijital Oyun & Eğlence Kodları',
    description: 'PUBG, Valorant, Roblox, Xbox, Free Fire, LoL ve tüm dijital kodlar.',
    icon: Gamepad2,
    color: 'bg-violet-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    url: 'https://www.kodmarketim.com/?refid=54108',
    badge: 'Oyun & Eğlence',
    category: 'dijital',
  },
  {
    id: 'sigorta',
    title: 'Tüm Sigorta Teklifleri',
    description: 'Trafik, kasko, DASK, sağlık, seyahat, ferdi kaza ve tüm sigorta branşlarında hızlı teklif alın.',
    icon: Shield,
    color: 'bg-teal-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    url: 'https://gelsinteklif.sigortayeri.com?reseller=54108',
    badge: 'Sigorta',
    category: 'finans',
  },
];

const categories = [
  { id: 'all', label: 'Tümü' },
  { id: 'internet', label: 'İnternet' },
  { id: 'tv', label: 'TV' },
  { id: 'dijital', label: 'Dijital' },
  { id: 'finans', label: 'Finans' },
];

const SubscriptionServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Abonelik & Hizmetler</h1>
              <p className="text-white/60 text-xs">İnternet, TV, dijital hizmetler ve daha fazlası</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{services.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Hizmet</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">4</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Kategori</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">7/24</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content -mt-5 px-4">
        {/* Search */}
        <div className="bank-card p-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Service Cards */}
        <div className="space-y-3 mb-6">
          {filteredServices.map((service) => {
            const IconComponent = service.icon;
            return (
              <a
                key={service.id}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bank-card p-4 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${service.bgColor} ${service.borderColor} border flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 ${service.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{service.title}</h3>
                      {service.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${service.bgColor} ${service.textColor} flex-shrink-0`}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg ${service.bgColor} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <ExternalLink className={`w-4 h-4 ${service.textColor}`} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aramanızla eşleşen hizmet bulunamadı.</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bank-card p-4 mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">TeknoKapsül Avantajı</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tüm hizmetlere özel bayi fiyatlarıyla erişin. Başvurularınız anında işleme alınır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionServicesPage;
