import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Package, CreditCard, FileText, Calendar, StickyNote, HelpCircle, Settings, Bot, Crown } from 'lucide-react';

export const TeknokapsulPage: React.FC = () => {
  const navigate = useNavigate();

  const teknokapsulItems = [

    {
      id: 'subscriptions',
      title: 'Aboneliklerim',
      description: 'Aboneliklerinizi yönetin',
      icon: CreditCard,
      path: '/subscriptions',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      id: 'cargo-tracking',
      title: 'Kargo Takip',
      description: 'Kargolarınızı takip edin',
      icon: Package,
      path: '/cargo-tracking',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'warranty-tracking',
      title: 'Garanti Takibi',
      description: 'Ürün garantilerinizi takip edin',
      icon: Shield,
      path: '/warranty-tracking',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'work-tracking',
      title: 'İş Takibi',
      description: 'İş geçmişinizi takip edin.',
      icon: Shield,
      path: '/work-tracking',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'notes',
      title: 'Notlarım',
      description: 'Notlarınızı yönetin',
      icon: StickyNote,
      path: '/notes',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'calendar',
      title: 'Takvim',
      description: 'Etkinliklerinizi planlayın',
      icon: Calendar,
      path: '/calendar',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      id: 'documents',
      title: 'Dosyalarım',
      description: 'Belgelerinizi saklayın',
      icon: FileText,
      path: '/documents',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      id: 'faq',
      title: 'Sıkça Sorulan Sorular',
      description: 'Yardım ve destek alın',
      icon: HelpCircle,
      path: '/faq',
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    },
    {
      id: 'ai-assistant',
      title: 'AI Asistan',
      description: 'Yapay zeka asistanınız',
      icon: Bot,
      path: '/ai-assistant',
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700'
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      description: 'Hesap ayarlarınızı yönetin',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    }
  ];

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TeknoKapsül</h1>
              <p className="text-white/60 text-xs">Teknolojik araçlarınız</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {teknokapsulItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="bank-card p-4 w-full flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeknokapsulPage;