import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  FileText, 
  HelpCircle, 
  Bot, 
  Settings, 
  Clock, 
  Bookmark, 
  Bell, 
  Search,
  ArrowRight,
  Zap,
  Shield,
  Smartphone,
  CreditCard
} from 'lucide-react';

const TeknoKapsulPage: React.FC = () => {
  const navigate = useNavigate();

  const kapsulFeatures = [
    {
      id: 'subscriptions',
      title: 'Aboneliklerim',
      description: 'Aboneliklerinizi yönetin ve kontrol edin',
      icon: CreditCard,
      path: '/subscriptions',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    {
      id: 'cargo-tracking',
      title: 'Kargo Takip',
      description: 'Kargo gönderilerinizi takip edin ve yönetin',
      icon: Package,
      path: '/cargo-tracking',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    {
      id: 'work-tracking',
      title: 'İş Takibi',
      description: 'İş süreçlerinizi ve projelerinizi takip edin',
      icon: Shield,
      path: '/work-tracking',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      id: 'documents',
      title: 'Dosyalarım',
      description: 'Belgelerinizi güvenli şekilde saklayın ve yönetin',
      icon: FileText,
      path: '/documents',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'calendar',
      title: 'Takvim',
      description: 'Randevularınızı ve etkinliklerinizi planlayın',
      icon: Calendar,
      path: '/calendar',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      id: 'warranty-tracking',
      title: 'Garanti Takibi',
      description: 'Ürün garantilerinizi takip edin ve yönetin',
      icon: Shield,
      path: '/warranty-tracking',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    }
  ];

  const quickActions = [
    {
      title: 'Abonelik Ekle',
      description: 'Yeni abonelik ekleyin',
      icon: CreditCard,
      action: () => navigate('/subscriptions?add=true')
    },
    {
      title: 'Kargo Sorgula',
      description: 'Kargo durumunu kontrol edin',
      icon: Package,
      action: () => navigate('/cargo-tracking')
    },
    {
      title: 'Belge Yükle',
      description: 'Yeni belge yükleyin',
      icon: FileText,
      action: () => navigate('/documents?upload=true')
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Hızlı Erişim',
      description: 'Tüm hizmetlerinize tek tıkla erişin'
    },
    {
      icon: Shield,
      title: 'Güvenli Saklama',
      description: 'Verileriniz güvenli şekilde saklanır'
    },
    {
      icon: Smartphone,
      title: 'Mobil Uyumlu',
      description: 'Her cihazdan kolayca kullanın'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">TeknoKapsül</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Aboneliklerinizi, kargolarınızı, belgelerinizi ve daha fazlasını tek yerden yönetin. Teknolojik araçlarınız.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#ffb700] hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#ffb700]/10 p-2 rounded-lg group-hover:bg-[#ffb700]/20 transition-colors">
                        <Icon className="w-5 h-5 text-[#ffb700]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Hizmetler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kapsulFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => navigate(feature.path)}
                  className={`bg-white rounded-xl p-4 border ${feature.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${feature.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-5 h-5 ${feature.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffb700] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="bg-[#ffb700]/10 p-3 rounded-full w-fit mx-auto mb-4">
                  <Icon className="w-8 h-8 text-[#ffb700]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">⚡</span>
              <h3 className="text-2xl font-bold text-gray-900">Hızlı Erişim</h3>
            </div>
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              TeknoKapsül ile tüm teknoloji ve finans araçlarınıza tek yerden erişin. 
              Garanti takibinden kargo takibine, kredi hesaplamadan finansal analizlere kadar her şey burada.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => navigate('/tekno-kapsul/notes')}
                className="bg-[#ffb700] hover:bg-[#e6a500] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Notlarıma Git <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('/tekno-kapsul/ai-assistant')}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                AI Asistan <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoKapsulPage;