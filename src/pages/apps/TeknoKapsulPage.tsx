import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Briefcase, FolderOpen, StickyNote, Calendar, Shield, Clock } from 'lucide-react';

const TeknoKapsulPage: React.FC = () => {
  const navigate = useNavigate();

  const kapsulFeatures = [
    {
      id: 'subscriptions',
      title: 'Aboneliklerim',
      description: 'Aboneliklerinizi yönetin ve maliyetleri kontrol edin',
      icon: Clock,
      path: '/tekno-kapsul/subscriptions',
      color: 'bg-orange-500'
    },
    {
      id: 'cargo-tracking',
      title: 'Kargo Takip',
      description: 'Kargo gönderilerinizi takip edin ve yönetin',
      icon: Package,
      path: '/tekno-kapsul/cargo-tracking',
      color: 'bg-orange-500'
    },
    {
      id: 'work-tracking',
      title: 'İş Takibi',
      description: 'İş süreçlerinizi ve projelerinizi takip edin',
      icon: Briefcase,
      path: '/tekno-kapsul/work-tracking',
      color: 'bg-purple-500'
    },
    {
      id: 'documents',
      title: 'Dosyalarım',
      description: 'Belgelerinizi güvenli şekilde saklayın ve yönetin',
      icon: FolderOpen,
      path: '/tekno-kapsul/documents',
      color: 'bg-green-500'
    },
    {
      id: 'calendar',
      title: 'Takvim',
      description: 'Randevularınızı ve etkinliklerinizi planlayın',
      icon: Calendar,
      path: '/tekno-kapsul/calendar',
      color: 'bg-red-500'
    },
    {
      id: 'warranty-tracking',
      title: 'Garanti Takibi',
      description: 'Ürün garantilerinizi takip edin ve yönetin',
      icon: Shield,
      path: '/tekno-kapsul/warranty-tracking',
      color: 'bg-cyan-500'
    }
  ];



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-[#ffb700] p-3 rounded-full mr-3">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">TeknoKapsül</h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Günlük iş süreçlerinizi kolaylaştıran araçlar ve hizmetler. Verimlilik ve organizasyon için her şey burada.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {kapsulFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="bg-white border-2 border-[#ffb700] rounded-[10px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-[#e6a500]"
              >
                <div className="p-5">
                  <div className={`${feature.color} p-2 rounded-lg inline-block mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffb700] font-medium text-sm">Başla →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
};

export default TeknoKapsulPage;