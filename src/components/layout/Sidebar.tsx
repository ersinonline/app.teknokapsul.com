import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Apps, CreditCard, Key, Settings,
  Wallet, Calendar, StickyNote, HelpCircle, Clock, LogOut, X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'budget', path: '/budget', label: 'Bütçe ve Analiz', icon: Wallet },
    { id: 'subscriptions', path: '/subscriptions', label: 'Abonelikler', icon: Clock },
    { id: 'services', path: '/services', label: 'Hizmetler', icon: Apps },
    { id: 'payments', path: '/payments', label: 'Borçlar', icon: CreditCard },
    { id: 'accounts', path: '/accounts', label: 'Hesaplar', icon: Key },
    { id: 'orders', path: '/orders', label: 'Siparişler', icon: ShoppingBag },
    { id: 'notes', path: '/notes', label: 'Notlar', icon: StickyNote },
    { id: 'calendar', path: '/calendar', label: 'Takvim', icon: Calendar },
    { id: 'faq', path: '/faq', label: 'Yardım', icon: HelpCircle },
    { id: 'settings', path: '/settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">TeknoKapsül</h2>
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Menüyü Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-yellow-50 text-yellow-700'
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
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};