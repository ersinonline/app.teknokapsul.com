import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, CreditCard, Calculator, DollarSign } from 'lucide-react';

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
    },
    {
      id: 'payment-plan',
      title: 'Ödeme Planı',
      description: 'Ev alım ödeme planları oluşturun ve yönetin',
      icon: CreditCard,
      path: '/tekno-finans/payment-plan',
      color: 'bg-orange-500'
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
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">TeknoFinans</h1>
            </div>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Finansal işlemlerinizi kolaylaştıran araçlar ve hizmetler. Para yönetimi ve analiz için her şey burada.
            </p>
          </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {financeFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="bg-white border-2 border-[#ffb700] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-[#e6a500]"
                style={{ borderRadius: '10px' }}
              >
                <div className="p-5">
                  <div className={`${feature.color} p-2 rounded-lg inline-block mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffb700] font-medium text-sm">Başla →</span>
                    <div className="w-2 h-2 bg-[#ffb700] rounded-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}

      </div>
    </div>
  );
};

export default TeknoFinansPage;