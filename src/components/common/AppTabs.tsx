import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Wrench, ShoppingCart } from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';

interface AppTabsProps {
  currentApp: 'tekno-kapsul' | 'tekno-finans' | 'tekno-hizmet';
}

const AppTabs: React.FC<AppTabsProps> = ({ currentApp }) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const tabs = [
    {
      id: 'tekno-kapsul',
      name: 'TeknoKapsül',
      icon: Package,
      path: '/tekno-kapsul',
      color: '#FF6B35',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
      hoverColor: 'hover:bg-orange-50'
    },
    {
      id: 'tekno-hizmet',
      name: 'TeknoHizmet',
      icon: Wrench,
      path: '/tekno-hizmet',
      color: '#3B82F6',
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      id: 'tekno-finans',
      name: 'TeknoFinans',
      icon: TrendingUp,
      path: '/tekno-finans',
      color: '#10B981',
      bgColor: 'bg-gradient-to-r from-green-500 to-teal-500',
      hoverColor: 'hover:bg-green-50'
    }
  ];

  return (
    <div className="flex items-center w-full bg-white border-b border-gray-200 shadow-sm">
      {/* Logo/Brand Section */}
      <div className="flex items-center px-4 py-3 border-r border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-[10px] flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-800">TeknoKapsül</span>
            <span className="text-xs text-gray-500">Dijital Çözümler</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentApp === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? `text-gray-800 bg-gray-50 border-b-2` 
                  : `text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b-2 border-b-transparent`
                }
              `}
              style={{
                borderBottomColor: isActive ? tab.color : 'transparent'
              }}
            >
              <div className={`p-1.5 rounded-[10px] ${
                isActive 
                  ? 'bg-white shadow-sm' 
                  : 'bg-gray-100'
              }`}>
                <Icon className={`w-4 h-4`} style={{
                  color: isActive ? tab.color : '#6B7280'
                }} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">{tab.name}</span>
                <span className="text-xs text-gray-500">
                  {tab.id === 'tekno-kapsul' && 'Ürün Yönetimi'}
                  {tab.id === 'tekno-hizmet' && 'Hizmet Platformu'}
                  {tab.id === 'tekno-finans' && 'Finansal Araçlar'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Section - User Info or Actions */}
      <div className="flex items-center px-4 py-3 border-l border-gray-200">
        <div className="flex items-center gap-2">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-7 h-7 rounded-[10px]",
                userButtonPopoverCard: "rounded-[10px]",
                userButtonPopoverActionButton: "rounded-[8px]"
              }
            }}
          />
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Kullanıcı'}
            </span>
            <span className="text-xs text-gray-500">Tekno Üye</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTabs;