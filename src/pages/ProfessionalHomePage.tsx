import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, CreditCard, DollarSign, Star, Shield, Smartphone, ShoppingBag, Server, User, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { GlassCard, PremiumCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';

interface SlideData {
  id: number;
  title: string;
  description: string;
  image: string;
  buttonText: string;
}

interface CategoryCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

interface Brand {
  id: string;
  name: string;
  logo: string;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  link: string;
  features: string[];
}

const ProfessionalHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const brandsRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const brandScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const campaignScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Slideshow data
  const slides: SlideData[] = [
    {
      id: 1,
      title: "Dijital Hayatınızı Kolaylaştırın",
      description: "Tüm ihtiyaçlarınız için tek platform. Bankacılık, alışveriş, eğlence ve daha fazlası.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      buttonText: "Keşfet"
    },
    {
      id: 2,
      title: "Akıllı Finansal Çözümler",
      description: "Bütçenizi yönetin, tasarruf edin ve finansal hedeflerinize ulaşın.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2026&q=80",
      buttonText: "Başla"
    },
    {
      id: 3,
      title: "Özel Hizmetler",
      description: "Size özel hizmetler ve avantajlarla farkı yaşayın.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80",
      buttonText: "Keşfet"
    }
  ];

  // Category cards data
  const categories: CategoryCard[] = [
    {
      id: 'kendim',
      title: 'Kapsülüm',
      icon: <User className="w-8 h-8 text-white" />,
      color: 'bg-[#FFB700]',
      route: '/kapsulum'
    },
    {
      id: 'evim',
      title: 'Evim',
      icon: <Home className="w-8 h-8 text-white" />,
      color: 'bg-emerald-500',
      route: '/evim'
    },
    {
      id: 'bankam',
      title: 'Bankam',
      icon: <CreditCard className="w-8 h-8 text-white" />,
      color: 'bg-red-500',
      route: '/bankam'
    },
    {
      id: 'maasim',
      title: 'İşim',
      icon: <DollarSign className="w-8 h-8 text-white" />,
      color: 'bg-purple-500',
      route: '/work-tracking'
    }
  ];

  // Info boxes data (unused - keeping for future use)
  /*
  const infoBoxes: InfoBox[] = [
    {
      id: 'bankam-info',
      title: 'Bankam',
      description: 'Tüm banka hesaplarınızı tek yerden yönetin',
      icon: <CreditCard className="w-12 h-12" />,
      color: 'bg-gradient-to-br from-[#FFB700] to-[#FF9500]'
    },
    {
      id: 'maasim-info',
      title: 'İşim',
      description: 'İş takibi ve maaş hesaplamalarınızı kolayca yapın',
      icon: <DollarSign className="w-12 h-12" />,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
    },
    {
      id: 'hizmetlerim',
      title: 'Hizmetlerim',
      description: 'Size özel hizmetleri keşfedin',
      icon: <Star className="w-12 h-12" />,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];
  */

  // Brand logos data
  const brands: Brand[] = [
    { id: 'digiturk', name: 'Digitürk', logo: '' },
    { id: 'tod', name: 'TOD', logo: '' },
    { id: 'dsmart', name: 'D-Smart', logo: '' },
    { id: 'turkcell', name: 'Turkcell', logo: '' },
    { id: 'vodafone', name: 'Vodafone', logo: '' },
    { id: 'turknet', name: 'TürkNet', logo: '' },
    { id: 'google', name: 'Google', logo: '' },
    { id: 'apple', name: 'Apple', logo: '' },
    { id: 'samsung', name: 'Samsung', logo: '' },
    { id: 'xiaomi', name: 'Xiaomi', logo: '' },
    { id: 'huawei', name: 'Huawei', logo: '' },
    { id: 'oppo', name: 'OPPO', logo: '' },
    { id: 'microsoft', name: 'Microsoft', logo: '' },
    { id: 'razer', name: 'Razer', logo: '' },
    { id: 'garena', name: 'Garena', logo: '' },
    { id: 'gameforge', name: 'Gameforge', logo: '' }
  ];

  // Campaign data from TeknoFirsat page
  const campaigns: Campaign[] = [
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

  // Auto-rotate slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleCategoryClick = (route: string) => {
    // Navigate to the specified route
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  // Auto scroll functions
  const startBrandAutoScroll = () => {
    if (brandScrollInterval.current) clearInterval(brandScrollInterval.current);
    brandScrollInterval.current = setInterval(() => {
      if (brandsRef.current && !showAllBrands) {
        const container = brandsRef.current;
        const cardWidth = 96; // 80px min-width + 16px gap
        const currentScroll = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (currentScroll >= maxScroll) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollTo({ left: currentScroll + cardWidth, behavior: 'smooth' });
        }
      }
    }, 10000); // 10 seconds
  };
  
  const startCampaignAutoScroll = () => {
    if (campaignScrollInterval.current) clearInterval(campaignScrollInterval.current);
    campaignScrollInterval.current = setInterval(() => {
      if (campaignsRef.current && !showAllCampaigns) {
        const container = campaignsRef.current;
        const cardWidth = 216; // 200px min-width + 16px gap
        const currentScroll = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (currentScroll >= maxScroll) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollTo({ left: currentScroll + cardWidth, behavior: 'smooth' });
        }
      }
    }, 15000); // 15 seconds
  };
  
  // Mouse wheel scroll handler
  const handleWheelScroll = (e: React.WheelEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && window.innerWidth >= 768) { // Only on desktop/tablet
      e.preventDefault();
      const scrollAmount = e.deltaY > 0 ? 100 : -100; // Scroll right or left
      ref.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag scroll handler
  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || window.innerWidth < 768) return;
    
    const container = ref.current;
    const startX = e.pageX - container.offsetLeft;
    const scrollLeft = container.scrollLeft;
    let isDown = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isDown = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.style.cursor = 'grab';
    };

    container.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    startBrandAutoScroll();
    startCampaignAutoScroll();
  
    return () => {
      if (brandScrollInterval.current) clearInterval(brandScrollInterval.current);
      if (campaignScrollInterval.current) clearInterval(campaignScrollInterval.current);
    };
  }, [showAllBrands, showAllCampaigns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-0">
      {/* Premium Hero Slideshow */}
      <section className="relative overflow-hidden px-4 pt-6 pb-4">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAgNGMwLTIuMjA5LTEuNzktNC00LTRzLTQgMS43OTEtNCA0IDEuNzkgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto">
          {/* Premium Slideshow Container */}
          <div className="relative mb-4 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-56 md:h-72 lg:h-96">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-1000 ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(168, 85, 247, 0.7)), url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                  <div className="relative h-full flex flex-col justify-center px-6 md:px-12 text-white">
                    <div className="animate-fade-in-up">
                      <Badge variant="premium" glow className="mb-4 inline-flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Yeni
                      </Badge>
                      <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 leading-tight drop-shadow-lg">
                        {slide.title}
                      </h2>
                      <p className="text-sm md:text-lg lg:text-xl opacity-95 mb-6 md:mb-8 leading-relaxed max-w-2xl drop-shadow">
                        {slide.description}
                      </p>
                      <button className="btn-glass group">
                        <span>{slide.buttonText}</span>
                        <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Quick Access Categories */}
      <section className="px-4 py-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-2 md:flex md:justify-center md:gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((category, index) => (
              <div
                key={category.id}
                data-testid={`category-${category.id}`}
                onClick={() => handleCategoryClick(category.route)}
                className="glass-card group flex-shrink-0 min-w-[110px] md:min-w-[160px] hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-4 p-4 ${category.color} rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    {category.icon}
                  </div>
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                    {category.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium "Senin İçin Derledik" Section */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Senin İçin Derledik
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <PremiumCard
              data-testid="maasim-card"
              gradient="from-blue-500 via-blue-600 to-indigo-600"
              onClick={() => navigate('/work-tracking')}
              className="animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="relative z-10">
                <div className="mb-4">
                  <DollarSign className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2">Maaşım+</h3>
                <p className="text-xs md:text-sm opacity-90">Maaş işlemleriniz tek yerde!</p>
              </div>
            </PremiumCard>
            
            <PremiumCard
              data-testid="bankam-card"
              gradient="from-emerald-500 via-teal-600 to-cyan-600"
              onClick={() => navigate('/bankam')}
              className="animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="relative z-10">
                <div className="mb-4">
                  <CreditCard className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2">Bankam+ Durumum</h3>
                <p className="text-xs md:text-sm opacity-90">Gelir - gider yönetiminiz tek ekranda!</p>
              </div>
            </PremiumCard>
            
            <PremiumCard
              data-testid="evim-card"
              gradient="from-purple-500 via-pink-500 to-rose-500"
              onClick={() => navigate('/evim')}
              className="col-span-2 md:col-span-1 lg:col-span-2 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <div className="relative z-10">
                <div className="mb-4">
                  <Star className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2">Ev ve eve dair her işlem tek yerde</h3>
                <p className="text-xs md:text-sm opacity-90">Ev işlemlerinizi kolayca yönetin</p>
              </div>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* Premium Brands Section */}
      <section className="px-4 py-8 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              Benim Dünyam Markaları
            </h2>
            <button 
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="text-blue-600 dark:text-blue-400 text-sm md:text-base font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {showAllBrands ? 'Daha Az Göster' : 'Tümünü Gör'}
            </button>
          </div>
          
          <div 
            ref={brandsRef}
            onWheel={(e) => handleWheelScroll(e, brandsRef)}
            onMouseDown={(e) => handleMouseDown(e, brandsRef)}
            className={`${showAllBrands ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4' : 'flex overflow-x-auto scrollbar-hide gap-4 pb-2 cursor-grab select-none'}`} 
            style={!showAllBrands ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}}
          >
            {brands.map((brand, index) => (
              <GlassCard
                key={brand.id}
                className="flex-shrink-0 min-w-[90px] md:min-w-0 p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white text-base md:text-lg font-bold">{brand.name.charAt(0)}</span>
                  </div>
                  <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 text-center font-medium whitespace-nowrap">{brand.name}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Campaigns Section */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Kampanyalar
            </h2>
            <button 
              onClick={() => setShowAllCampaigns(!showAllCampaigns)}
              className="text-blue-600 dark:text-blue-400 text-sm md:text-base font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {showAllCampaigns ? 'Daha Az Göster' : 'Tümünü Gör'}
            </button>
          </div>
          
          <div 
            ref={campaignsRef}
            onWheel={(e) => handleWheelScroll(e, campaignsRef)}
            onMouseDown={(e) => handleMouseDown(e, campaignsRef)}
            className={`${showAllCampaigns ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex overflow-x-auto scrollbar-hide gap-6 pb-2 cursor-grab select-none'}`} 
            style={!showAllCampaigns ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}}
          >
            {campaigns.map((campaign, index) => {
              const IconComponent = campaign.icon;
              return (
                <div
                  key={campaign.id}
                  data-testid={`campaign-${campaign.id}`}
                  onClick={() => window.open(campaign.link, '_blank')}
                  className={`
                    glass-card hover-lift
                    ${showAllCampaigns ? '' : 'flex-shrink-0 min-w-[280px] max-w-[280px]'}
                    animate-fade-in-up
                    border-l-4 ${campaign.borderColor}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${campaign.color} rounded-xl p-3 shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="premium" glow>
                        {campaign.discount}
                      </Badge>
                    </div>
                    
                    <h3 className={`text-base md:text-lg font-bold ${campaign.textColor} mb-2`}>
                      {campaign.title}
                    </h3>
                    <p className={`text-sm ${campaign.textColor} opacity-90 mb-2 font-medium`}>
                      {campaign.subtitle}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                    
                    <div className="space-y-2">
                      {campaign.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <div className={`w-1.5 h-1.5 ${campaign.color} rounded-full mr-2 flex-shrink-0`}></div>
                          <span className="line-clamp-1">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className={`${campaign.color} text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity w-full flex items-center justify-center gap-2`}>
                        <span>Detaylara Git</span>
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfessionalHomePage;