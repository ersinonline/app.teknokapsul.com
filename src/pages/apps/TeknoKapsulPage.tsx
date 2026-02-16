import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  FileText, 
  Bot, 
  ArrowRight,
  Zap,
  Shield,
  Smartphone,
  CreditCard,
  ShoppingBag
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
    },
    {
      id: 'digital-codes',
      title: 'Dijital Kodlar',
      description: 'Dijital ürün ve kod satın alın',
      icon: ShoppingBag,
      path: '/dijital-kodlar',
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-200'
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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TeknoKapsül</h1>
              <p className="text-white/60 text-xs">Araçlar ve hizmetler</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button key={index} onClick={action.action} className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors">
                  <Icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                  <p className="text-white text-[10px] font-medium">{action.title.split(' ').slice(0, 2).join(' ')}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {kapsulFeatures.map((feature) => {
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

        {/* Quick Links */}
        <div className="bank-card p-4">
          <div className="flex gap-2">
            <button onClick={() => navigate('/tekno-kapsul/notes')} className="flex-1 bg-primary text-white px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5">
              Notlarım <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => navigate('/tekno-kapsul/ai-assistant')} className="flex-1 bg-muted text-foreground px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5">
              AI Asistan <Bot className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeknoKapsulPage;