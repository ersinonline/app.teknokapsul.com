import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple as Apps, Clock, StickyNote, Calendar, Settings, HelpCircle, LogOut, TrendingUp, TrendingDown, CreditCard, Package, PieChart, FolderOpen, Calculator, ShoppingBag, Shield, Target, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const mainMenuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'income', path: '/income', label: 'Gelirlerim', icon: TrendingUp },
    { id: 'expenses', path: '/expenses', label: 'Giderlerim', icon: TrendingDown },
    { id: 'budget', path: '/budget', label: 'Bütçe Planlama', icon: Wallet },
    { id: 'goals', path: '/goals', label: 'Hedeflerim', icon: Target },
    { id: 'portfolio', path: '/portfolio', label: 'Portföyüm', icon: PieChart },
    { id: 'subscriptions', path: '/subscriptions', label: 'Aboneliklerim', icon: Clock },
    { id: 'financial-data', path: '/financial-data', label: 'Finansal Verilerim', icon: CreditCard },
    { id: 'credit-score', path: '/credit-score', label: 'Findeks Kredi Notu', icon: TrendingUp },
    { id: 'warranty-tracking', path: '/warranty-tracking', label: 'Garanti Takibi', icon: Shield },
  ];

  const otherMenuItems = [
    { id: 'services', path: '/services', label: 'Hizmetler', icon: Apps },
    { id: 'documents', path: '/documents', label: 'Dosyalarım', icon: FolderOpen },
    { id: 'loan-calculator', path: '/loan-calculator', label: 'Kredi Hesaplama', icon: Calculator },

    { id: 'shop-rewards', path: '/shop-rewards', label: 'Harcadıkça Kazan', icon: ShoppingBag },
    { id: 'cargo-tracking', path: '/cargo-tracking', label: 'Kargo Takip', icon: Package },
    { id: 'notes', path: '/notes', label: 'Notlar', icon: StickyNote },
    { id: 'calendar', path: '/calendar', label: 'Takvim', icon: Calendar },
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
    <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg hidden lg:block">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">TeknoKapsül</h2>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* Ana Menü */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
              Ana Menü
            </h3>
            <ul className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-600' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Diğer Hizmetler */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
              Diğer Hizmetler
            </h3>
            <ul className="space-y-1">
              {otherMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-600' : ''}`} />
                      <span>{item.label}</span>
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;