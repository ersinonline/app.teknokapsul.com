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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TeknoFinans</h1>
              <p className="text-white/60 text-xs">Finansal araçlar ve hizmetler</p>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button key={index} onClick={action.action} className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors">
                  <Icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                  <p className="text-white text-[10px] font-medium">{action.title.split(' ').slice(1).join(' ')}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {/* Features */}
        {financeFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className="bank-card p-4 w-full flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${feature.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{feature.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeknoFinansPage;