import React, { useEffect } from 'react';
import {
  Home,
  Calculator,
  ShoppingBag,
  X,
  LogOut,
  Settings,
  User,
  Bell,
} from 'lucide-react';
import { Logo } from './common/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'credit-calculator', label: 'Kredi Hesaplama', icon: Calculator },
    { id: 'shop-rewards', label: 'Harcadıkça Kazan', icon: ShoppingBag },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const sidebarClasses = `
    fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-white via-gray-50 to-gray-100 border-r border-gray-200/50 shadow-2xl backdrop-blur-sm transform transition-all duration-500 ease-out z-50
    ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}
  `;

  // Escape tuşuyla menüyü kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={sidebarClasses}
        aria-label="Yan Menü"
        aria-expanded={isOpen}
      >
        <div className="p-8 border-b border-gray-200/30 bg-gradient-to-br from-[#ffb700] via-[#ffc533] to-[#e6a500] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="flex items-center justify-center relative z-10">
            <div className="flex items-center space-x-4">
              <div className="bg-white/95 p-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
                <Logo className="w-10 h-10" />
              </div>
              <div className="text-white">
                <h2 className="font-bold text-xl tracking-wide drop-shadow-sm">TeknoKapsül</h2>
                <p className="text-sm opacity-95 font-medium">Dijital Çözümler</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg absolute top-2 right-2 text-white"
              aria-label="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-8 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menü</h3>
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                    <button
                      onClick={() => {
                        onTabChange(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden backdrop-blur-sm
                        ${
                          activeTab === item.id
                            ? 'bg-gradient-to-r from-[#ffb700] to-[#e6a500] text-white shadow-xl transform scale-[1.02] border border-[#ffb700]/20'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:text-gray-900 hover:shadow-lg hover:scale-[1.01] border border-transparent hover:border-gray-200/50'
                        }
                      `}
                      aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        activeTab === item.id 
                          ? 'bg-white/25 shadow-lg' 
                          : 'bg-gray-100/80 group-hover:bg-[#ffb700]/15 group-hover:shadow-md'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="absolute right-4 flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 transition-transform duration-700 ${
                        activeTab === item.id ? 'translate-x-full' : '-translate-x-full group-hover:translate-x-full'
                      }`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="p-8 border-t border-gray-200/30 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all duration-300 group relative overflow-hidden border border-transparent hover:border-red-200/50 hover:shadow-lg hover:scale-[1.01]"
            aria-label="Çıkış Yap"
          >
            <div className="p-3 rounded-xl bg-gray-200/80 group-hover:bg-red-100 transition-all duration-300 group-hover:shadow-md">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Çıkış Yap</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent transform -skew-x-12 transition-transform duration-700 -translate-x-full group-hover:translate-x-full" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;