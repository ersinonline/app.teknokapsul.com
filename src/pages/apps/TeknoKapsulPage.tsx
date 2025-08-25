import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Briefcase, FolderOpen, StickyNote, Calendar, Shield, Clock } from 'lucide-react';

const TeknoKapsulPage: React.FC = () => {
  const navigate = useNavigate();

  const kapsulFeatures = [
    {
      id: 'services',
      title: 'Hizmetler',
      description: 'Çeşitli dijital hizmetlere erişim sağlayın',
      icon: Package,
      path: '/tekno-kapsul/services',
      color: 'bg-blue-500'
    },
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
      id: 'notes',
      title: 'Notlar',
      description: 'Önemli notlarınızı kaydedin ve organize edin',
      icon: StickyNote,
      path: '/tekno-kapsul/notes',
      color: 'bg-yellow-500'
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
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Anasayfaya Dön</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#ffb700] p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">TeknoKapsül</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#ffb700] p-4 rounded-full mr-4">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">🛠 TeknoKapsül</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Günlük iş süreçlerinizi kolaylaştıran araçlar ve hizmetler. Verimlilik ve organizasyon için her şey burada.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kapsulFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="bg-white border-2 border-[#ffb700] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-[#e6a500]"
              >
                <div className="p-6">
                  <div className={`${feature.color} p-3 rounded-lg inline-block mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
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