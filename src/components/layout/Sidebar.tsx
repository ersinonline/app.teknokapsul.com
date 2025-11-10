import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Clock,
  Menu,
  X,
  Send,
  Receipt,
  Landmark,
  PiggyBank
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const mainMenuItems = [
    { id: 'home', path: '/', label: 'Anasayfa', icon: Home },
    { id: 'income', path: '/income', label: 'Gelirler', icon: TrendingUp },
    { id: 'expense', path: '/expense', label: 'Giderler', icon: TrendingDown },
    { id: 'portfolio', path: '/portfolio', label: 'Portföy', icon: PieChart },
    { id: 'goals', path: '/goals', label: 'Hedefler', icon: Target },
    { id: 'subscriptions', path: '/subscriptions', label: 'Abonelikler', icon: Clock },
  ];

  const bankingMenuItems = [
    { id: 'transfer', path: '/transfer', label: 'Para Gönder', icon: Send },
    { id: 'bills', path: '/bills', label: 'Fatura Öde', icon: Receipt },
    { id: 'credit', path: '/credit-application', label: 'Kredi Başvurusu', icon: Landmark },
    { id: 'savings', path: '/savings', label: 'Birikim Yap', icon: PiggyBank },
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

  const renderMenuItems = (items: typeof mainMenuItems) => {
    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <li key={item.id}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white shadow-lg hidden xl:flex flex-col transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-800">FinansUsta</h2>
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
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          {renderMenuItems(mainMenuItems)}
        </div>

        <div>
          {!isCollapsed && (
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Bankacılık İşlemleri
            </h3>
          )}
          {renderMenuItems(bankingMenuItems)}
        </div>

        <div>
          {!isCollapsed && (
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Destek
            </h3>
          )}
          {renderMenuItems(supportItems)}
        </div>
      </nav>

      <div className="p-4 border-t mt-auto">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
          title={isCollapsed ? 'Çıkış Yap' : undefined}
        >
          <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
          {!isCollapsed && <span className="font-medium">Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;