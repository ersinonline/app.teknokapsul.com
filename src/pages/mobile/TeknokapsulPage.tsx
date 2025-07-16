import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Package, CreditCard, FileText, Calendar, StickyNote, HelpCircle, Settings, Bot, Crown } from 'lucide-react';

export const TeknokapsulPage: React.FC = () => {
  const navigate = useNavigate();

  const teknokapsulItems = [
    {
      id: 'premium',
      title: 'Premium Üyelik',
      description: 'Premium özelliklerini keşfedin',
      icon: Crown,
      path: '/premium',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-transparent rounded-b-lg">
        <div className="px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">🚀 TeknoKapsül</h1>
          <p className="text-gray-600 mt-2 text-lg">Teknolojik araçlarınız</p>
        </div>
      </div>

      {/* Service Cards */}
      <div className="px-4 py-6 -mt-4">
        <div className="grid grid-cols-1 gap-4">
          {teknokapsulItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-lg p-5 border border-gray-200 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="px-4 py-2">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-bold text-gray-900">Hızlı Erişim</h3>
          </div>
          <p className="text-gray-600 text-sm">
            TeknoKapsül ile tüm teknoloji ve finans araçlarınıza tek yerden erişin. 
            Garanti takibinden kargo takibine, kredi hesaplamadan finansal analizlere kadar her şey burada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeknokapsulPage;