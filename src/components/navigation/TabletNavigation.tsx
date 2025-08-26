import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart, 
  Clock, 
  Calculator, 
  Package, 
  Settings,
  Menu,
  X,
  Briefcase,
  Zap,
  Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// import { usePremium } from '../../contexts/PremiumContext';

interface TabletNavigationProps {
  className?: string;
}

export const TabletNavigation: React.FC<TabletNavigationProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  // const { isPremium } = usePremium();

  const mainMenuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'teknofinans', path: '/mobile-finance', label: 'TeknoFinans', icon: PieChart },
    { id: 'teknohizmet', path: '/teknokapsul', label: 'TeknoKapsül', icon: Zap },
    { id: 'teknokapsul', path: '/services', label: 'TeknoHizmet', icon: Briefcase },
  ];

  const secondaryMenuItems = [
    { id: 'income', path: '/income', label: 'Gelirlerim', icon: TrendingUp },
    { id: 'expenses', path: '/expenses', label: 'Giderlerim', icon: TrendingDown },
    { id: 'goals', path: '/goals', label: 'Hedeflerim', icon: Target },
    { id: 'portfolio', path: '/portfolio', label: 'Portföyüm', icon: PieChart },
    { id: 'subscriptions', path: '/subscriptions', label: 'Aboneliklerim', icon: Clock },
    // { id: 'premium', path: '/premium', label: 'Premium', icon: Crown },
    { id: 'credit-calculator', path: '/credit-calculator', label: 'Kredi Hesaplama', icon: Calculator },
    { id: 'cargo-tracking', path: '/cargo-tracking', label: 'Kargo Takip', icon: Package },
    { id: 'settings', path: '/settings', label: 'Ayarlar', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Tablet Header */}
      <div className={`bg-white border-b shadow-sm ${className}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">TeknoKapsül</h1>
                {/* <PremiumBadge size="lg" className="scale-[2] ml-6" showText={false} /> */}
              </div>
          </div>
          
          {/* Ana Menü - Sadece Desktop */}
          <div className="hidden xl:flex items-center gap-1">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu - Tablet Portrait */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Menü</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Ana Menü
                  </h3>
                  {mainMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuItemClick(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Diğer
                  </h3>
                  {secondaryMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuItemClick(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {/* {item.id === 'premium' && !isPremium && (
                          <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Yeni
                          </span>
                        )} */}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};