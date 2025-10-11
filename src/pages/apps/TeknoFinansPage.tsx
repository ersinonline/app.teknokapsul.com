import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, CreditCard, Calculator, Wallet, Building, Coins, Receipt, Shield, ArrowRight } from 'lucide-react';

const TeknoFinansPage: React.FC = () => {
  const navigate = useNavigate();

  const financeFeatures = [
    {
      id: 'income',
      title: 'Gelirlerim',
      description: 'Gelir kaynaklarınızı takip edin ve analiz edin',
      icon: TrendingUp,
      path: '/tekno-finans/income',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    {
      id: 'expenses',
      title: 'Giderlerim',
      description: 'Harcamalarınızı kategorize edin',
      icon: TrendingDown,
      path: '/tekno-finans/expenses',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    {
      id: 'goals',
      title: 'Hedeflerim',
      description: 'Finansal hedeflerinizi belirleyin ve takip edin',
      icon: Target,
      path: '/tekno-finans/goals',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      id: 'portfolio',
      title: 'Portföyüm',
      description: 'Yatırım portföyünüzü yönetin',
      icon: PieChart,
      path: '/tekno-finans/portfolio',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      id: 'stock-market',
      title: 'Borsa Takibi',
      description: 'Borsa verilerini takip edin ve analiz yapın',
      icon: BarChart3,
      path: '/tekno-finans/stock-market',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'financial-data',
      title: 'Finansal Verilerim',
      description: 'Finansal verilerinizi görüntüleyin',
      icon: CreditCard,
      path: '/tekno-finans/financial-data',
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      borderColor: 'border-teal-200'
    },
    {
      id: 'credit-score',
      title: 'Findeks Kredi Notu',
      description: 'Kredi notunuzu takip edin ve geliştirin',
      icon: Shield,
      path: '/tekno-finans/credit-score',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'credit-calculator',
      title: 'Kredi Hesaplama',
      description: 'Kredi hesaplamaları yapın ve karşılaştırın',
      icon: Calculator,
      path: '/tekno-finans/credit-calculator',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'payment-plan',
      title: 'Ödeme Planı',
      description: 'Ev alım ödeme planları oluşturun ve yönetin',
      icon: Building,
      path: '/tekno-finans/payment-plan',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    }
  ];

  const quickActions = [
    {
      title: 'Hızlı Gider Ekle',
      description: 'Anında gider kaydı yapın',
      icon: Receipt,
      action: () => navigate('/tekno-finans/expenses?quick=true')
    },
    {
      title: 'Bütçe Kontrolü',
      description: 'Aylık bütçenizi kontrol edin',
      icon: Wallet,
      action: () => navigate('/tekno-finans/budget')
    },
    {
      title: 'Yatırım Analizi',
      description: 'Portföy performansını görün',
      icon: Coins,
      action: () => navigate('/tekno-finans/portfolio')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">TeknoFinans</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Finansal işlemlerinizi kolaylaştıran araçlar ve hizmetler. Para yönetimi ve analiz için her şey burada.
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Finansal Araçlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {financeFeatures.map((feature) => {
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

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Finansal Analiz</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Gelir-gider analizleri, trend takibi ve detaylı raporlarla finansal durumunuzu tam kontrol altında tutun.
            </p>
            <button 
              onClick={() => navigate('/tekno-finans/financial-data')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              Analize Başla <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hedef Takibi</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Finansal hedeflerinizi belirleyin, ilerlemenizi takip edin ve başarıya ulaşmak için plan yapın.
            </p>
            <button 
              onClick={() => navigate('/tekno-finans/goals')}
              className="text-green-600 hover:text-green-800 font-medium flex items-center gap-2"
            >
              Hedef Belirle <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoFinansPage;