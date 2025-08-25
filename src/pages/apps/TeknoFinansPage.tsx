import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, CreditCard, Calculator, ArrowLeft } from 'lucide-react';

const TeknoFinansPage: React.FC = () => {
  const navigate = useNavigate();

  const financeFeatures = [
    {
      id: 'income',
      title: 'Gelirlerim',
      description: 'Gelir kaynaklarınızı takip edin ve analiz edin',
      icon: TrendingUp,
      path: '/tekno-finans/income',
      color: 'bg-green-500'
    },
    {
      id: 'expenses',
      title: 'Giderlerim',
      description: 'Harcamalarınızı kategorize edin ve kontrol altında tutun',
      icon: TrendingDown,
      path: '/tekno-finans/expenses',
      color: 'bg-red-500'
    },
    {
      id: 'goals',
      title: 'Hedeflerim',
      description: 'Finansal hedeflerinizi belirleyin ve takip edin',
      icon: Target,
      path: '/tekno-finans/goals',
      color: 'bg-blue-500'
    },
    {
      id: 'portfolio',
      title: 'Portföyüm',
      description: 'Yatırım portföyünüzü yönetin ve performansını izleyin',
      icon: PieChart,
      path: '/tekno-finans/portfolio',
      color: 'bg-purple-500'
    },
    {
      id: 'stock-market',
      title: 'Borsa',
      description: 'Borsa verilerini takip edin ve analiz yapın',
      icon: BarChart3,
      path: '/tekno-finans/stock-market',
      color: 'bg-indigo-500'
    },

    {
      id: 'financial-data',
      title: 'Finansal Verilerim',
      description: 'Banka hesaplarınızı ve finansal verilerinizi görüntüleyin',
      icon: CreditCard,
      path: '/tekno-finans/financial-data',
      color: 'bg-teal-500'
    },
    {
      id: 'credit-score',
      title: 'Findeks Kredi Notu',
      description: 'Kredi notunuzu takip edin ve geliştirin',
      icon: TrendingUp,
      path: '/tekno-finans/credit-score',
      color: 'bg-emerald-500'
    },

    {
      id: 'credit-calculator',
      title: 'Kredi Hesaplama',
      description: 'Kredi hesaplamaları yapın ve karşılaştırın',
      icon: Calculator,
      path: '/tekno-finans/credit-calculator',
      color: 'bg-yellow-500'
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
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">TeknoFinans</h1>
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
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">💰 TeknoFinans</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Finansal hayatınızı kontrol altına alın. Gelir, gider, yatırım ve hedeflerinizi tek platformda yönetin.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financeFeatures.map((feature) => {
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

export default TeknoFinansPage;