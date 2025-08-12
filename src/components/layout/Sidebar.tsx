import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple as Apps, Clock, StickyNote, Calendar, Settings, HelpCircle, LogOut, TrendingUp, TrendingDown, CreditCard, Package, PieChart, FolderOpen, Calculator, Shield, Target, Menu, X, Briefcase, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// import { usePremium } from '../../contexts/PremiumContext';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  // const { isPremium } = usePremium();

  const dashboardItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
  ];

  const financeItems = [
    { id: 'income', path: '/income', label: 'Gelirlerim', icon: TrendingUp },
    { id: 'expenses', path: '/expenses', label: 'Giderlerim', icon: TrendingDown },
    // { id: 'budget', path: '/budget', label: 'Bütçe Planlama', icon: Wallet }, // Geçici olarak gizlendi
    { id: 'goals', path: '/goals', label: 'Hedeflerim', icon: Target },
    { id: 'portfolio', path: '/portfolio', label: 'Portföyüm', icon: PieChart },
    { id: 'stock-market', path: '/stock-market', label: 'Borsa', icon: BarChart3 },
    { id: 'subscriptions', path: '/subscriptions', label: 'Aboneliklerim', icon: Clock },
  ];

  const dataItems = [
    { id: 'financial-data', path: '/financial-data', label: 'Finansal Verilerim', icon: CreditCard },
    { id: 'credit-score', path: '/credit-score', label: 'Findeks Kredi Notu', icon: TrendingUp },
    { id: 'warranty-tracking', path: '/warranty-tracking', label: 'Garanti Takibi', icon: Shield },
  ];

  // const premiumMenuItems = [
  //   { id: 'premium', path: '/premium', label: 'Premium', icon: Crown },
  //   ...(isPremium ? [{ id: 'premium-manage', path: '/premium/manage', label: 'Premium Yönetimi', icon: UserCog }] : [])
  // ];

  const servicesItems = [
    { id: 'services', path: '/services', label: 'Hizmetler', icon: Apps },
    { id: 'credit-calculator', path: '/credit-calculator', label: 'Kredi Hesaplama', icon: Calculator },
    // { id: 'shop-rewards', path: '/shop-rewards', label: 'Harcadıkça Kazan', icon: ShoppingBag },
    { id: 'cargo-tracking', path: '/cargo-tracking', label: 'Kargo Takip', icon: Package },
  ];

  const toolsItems = [
    { id: 'work-tracking', path: '/work-tracking', label: 'İş Takibi', icon: Briefcase },
    { id: 'documents', path: '/documents', label: 'Dosyalarım', icon: FolderOpen },
    { id: 'notes', path: '/notes', label: 'Notlar', icon: StickyNote },
    { id: 'calendar', path: '/calendar', label: 'Takvim', icon: Calendar },
  ];

  const supportItems = [
    { id: 'settings', path: '/settings', label: 'Ayarlar', icon: Settings },
    { id: 'faq', path: '/faq', label: 'Yardım', icon: HelpCircle }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white shadow-lg hidden xl:block transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl font-semibold">TeknoKapsül</h2>
                {/* isPremium && (
                  <img src="https://i.hizliresim.com/3g6ahm4.png" alt="TeknoKapsül" className="h-6 object-contain" />
                ) */}
              </div>
            )}
            <button
              onClick={() => {
                const newCollapsed = !isCollapsed;
                setIsCollapsed(newCollapsed);
                onCollapseChange?.(newCollapsed);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <div className="mb-6">
            <ul className="space-y-1">
              {dashboardItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Finansal Yönetim */}
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Finansal Yönetim
              </h3>
            )}
            <ul className="space-y-1">
              {financeItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Veri Analizi */}
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Veri Analizi
              </h3>
            )}
            <ul className="space-y-1">
              {dataItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Premium */}
          {/* <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Premium
              </h3>
            )}
            <ul className="space-y-1">
              {premiumMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {item.id === 'premium' && !isPremium && (
                            <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Yeni
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div> */}

          {/* Hizmetler */}
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Hizmetler
              </h3>
            )}
            <ul className="space-y-1">
              {servicesItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Araçlar */}
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Araçlar
              </h3>
            )}
            <ul className="space-y-1">
              {toolsItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Destek */}
          <div>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                Destek
              </h3>
            )}
            <ul className="space-y-1">
              {supportItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? 'text-yellow-600' : ''}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
            title={isCollapsed ? 'Çıkış Yap' : undefined}
          >
            <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;