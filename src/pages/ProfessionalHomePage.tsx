import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, CreditCard, DollarSign, TrendingUp, Shield, Zap, ArrowRight, Star, ChevronRight } from 'lucide-react';

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
  description: string;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  link: string;
}

const ProfessionalHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: SlideData[] = [
    {
      id: 1,
      title: "Finansal Gücünüzü Keşfedin",
      description: "Tüm finansal işlemlerinizi tek platformdan yönetin. Güvenli, hızlı ve kolay.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      buttonText: "Başlayın"
    },
    {
      id: 2,
      title: "Akıllı Tasarruf Çözümleri",
      description: "Hedeflerinize ulaşın, bütçenizi optimize edin, geleceğinizi planlayın.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2026&q=80",
      buttonText: "Keşfet"
    },
    {
      id: 3,
      title: "7/24 Hizmetinizdeyiz",
      description: "Her an, her yerde. Dijital bankacılığın gücünü yaşayın.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
      buttonText: "Daha Fazla"
    }
  ];

  const categories: CategoryCard[] = [
    {
      id: 'kendim',
      title: 'Kapsülüm',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-[#ffb700]',
      route: '/kapsulum',
      description: 'Kişisel bilgileriniz'
    },
    {
      id: 'evim',
      title: 'Evim',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-emerald-500',
      route: '/evim',
      description: 'Ev yönetimi'
    },
    {
      id: 'bankam',
      title: 'Bankam',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-blue-500',
      route: '/bankam',
      description: 'Finansal işlemler'
    },
    {
      id: 'maasim',
      title: 'İşim',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
      route: '/work-tracking',
      description: 'İş takibi'
    }
  ];

  const campaigns: Campaign[] = [
    {
      id: 'sigortam',
      title: 'Sigortam.net',
      subtitle: '300 TL İndirim',
      description: 'Sigorta ihtiyaçlarınız için özel fırsatlar',
      icon: Shield,
      link: 'http://sgrtm.net/8J9L8400495JU'
    },
    {
      id: 'investment',
      title: 'Yatırım Fırsatları',
      subtitle: 'Özel Oranlar',
      description: 'Yatırımlarınızı değerlendirin',
      icon: TrendingUp,
      link: '#'
    },
    {
      id: 'loan',
      title: 'Krediler',
      subtitle: 'Avantajlı Faiz',
      description: 'Size özel kredi teklifleri',
      icon: Star,
      link: '#'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleCategoryClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-0">
      {/* Hero Section - Banking Style */}
      <section className="relative bg-white px-4 pt-6 pb-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          {/* Hero Slideshow */}
          <div className="relative mb-6 rounded-2xl overflow-hidden bg-[#ffb700] shadow-lg">
            <div className="relative h-52 md:h-64">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(rgba(255, 183, 0, 0.9), rgba(255, 183, 0, 0.95)), url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="h-full flex flex-col justify-center px-6 md:px-10 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm md:text-base opacity-95 mb-6 leading-relaxed max-w-2xl">
                      {slide.description}
                    </p>
                    <button className="bg-white text-[#ffb700] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors self-start flex items-center gap-2">
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access - Banking Style */}
      <section className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header">Hızlı Erişim</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                data-testid={`category-${category.id}`}
                onClick={() => handleCategoryClick(category.route)}
                className="bank-card-interactive p-6 text-center"
              >
                <div className={`${category.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {category.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards - Banking Style */}
      <section className="px-4 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header">Sizin İçin</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Maaşım Card */}
            <div 
              data-testid="maasim-card"
              onClick={() => navigate('/work-tracking')}
              className="bank-card-interactive p-6"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Maaşım+</h3>
              <p className="text-sm text-gray-600 mb-4">Maaş işlemleriniz tek yerde</p>
              <div className="flex items-center text-[#ffb700] text-sm font-semibold">
                <span>Detayları Gör</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Bankam Card */}
            <div 
              data-testid="bankam-card"
              onClick={() => navigate('/bankam')}
              className="bank-card-interactive p-6"
            >
              <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bankam Durumum</h3>
              <p className="text-sm text-gray-600 mb-4">Gelir - gider yönetiminiz</p>
              <div className="flex items-center text-[#ffb700] text-sm font-semibold">
                <span>Detayları Gör</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Evim Card */}
            <div 
              data-testid="evim-card"
              onClick={() => navigate('/evim')}
              className="bank-card-interactive p-6"
            >
              <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Evim</h3>
              <p className="text-sm text-gray-600 mb-4">Ev işlemlerinizi yönetin</p>
              <div className="flex items-center text-[#ffb700] text-sm font-semibold">
                <span>Detayları Gör</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns - Banking Style */}
      <section className="px-4 py-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-header mb-0">Fırsatlar</h2>
            <button className="text-[#ffb700] text-sm font-semibold flex items-center gap-1">
              <span>Tümü</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((campaign) => {
              const IconComponent = campaign.icon;
              return (
                <div
                  key={campaign.id}
                  data-testid={`campaign-${campaign.id}`}
                  onClick={() => window.open(campaign.link, '_blank')}
                  className="bank-card-interactive p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-[#ffb700]/10 w-12 h-12 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-[#ffb700]" />
                    </div>
                    <span className="badge badge-primary">{campaign.subtitle}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {campaign.description}
                  </p>
                  
                  <div className="flex items-center text-[#ffb700] text-sm font-semibold">
                    <span>İncele</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
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
