import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Wrench } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';

interface AppTabsProps {
  currentApp: 'tekno-kapsul' | 'tekno-finans' | 'tekno-hizmet' | 'tekno-firsat' | null;
}

const AppTabs: React.FC<AppTabsProps> = ({ currentApp }) => {
  const navigate = useNavigate();

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
    },
    {
      id: 'tekno-firsat',
      name: 'TeknoFırsat',
      icon: TrendingUp,
      path: '/tekno-firsat',
      color: '#10B981',
      bgColor: 'bg-gradient-to-r from-green-500 to-teal-500',
      hoverColor: 'hover:bg-green-50'
    }
  ];

  return (
    <div className="flex items-center justify-between w-full max-w-full bg-white border-b border-gray-200 shadow-sm overflow-x-hidden">
      {/* Logo/Brand Section */}
      <div className="flex items-center px-3 sm:px-4 py-4 sm:py-3 sm:border-r sm:border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-90 active:opacity-80 focus:outline-none"
          aria-label="Anasayfa - TeknoKapsül"
        >
          <img src="/logo.ico" alt="TeknoKapsül" className="w-9 h-9" />
          <div className="flex flex-col text-left">
            <span className="text-base sm:text-base font-bold text-gray-800">TeknoKapsül</span>
            <span className="text-xs sm:block text-gray-500">Dijital Çözümler</span>
          </div>
        </button>
      </div>

      {/* Navigation Tabs - Gizli */}
      <div className="hidden">
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
                  {tab.id === 'tekno-kapsul' && 'Günlük Yönetim'}
                  {tab.id === 'tekno-hizmet' && 'Hizmet Platformu'}
                  {tab.id === 'tekno-finans' && 'Finansal Araçlar'}
                  {tab.id === 'tekno-firsat' && 'Müthiş Fırsatlar'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Section - User Info or Actions */}
      <div className="flex items-center px-3 sm:px-4 py-4 sm:py-3 sm:border-l sm:border-gray-200 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 rounded-[12px]",
                userButtonPopoverCard: "rounded-[12px]",
                userButtonPopoverActionButton: "rounded-[10px]"
              }
            }}
          />

        </div>
      </div>
    </div>
  );
};

export default AppTabs;