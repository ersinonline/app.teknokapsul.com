import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Apple as Apps, Clock, MoreHorizontal } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems = [
    { icon: Home, label: 'Ana Sayfa', path: '/dashboard' },
    { icon: Apps, label: 'Hizmetler', path: '/services' },
    { icon: CreditCard, label: 'Borçlar', path: '/payments' },
    { icon: Clock, label: 'Abonelikler', path: '/subscriptions' },
    { icon: MoreHorizontal, label: 'Diğer', path: '#', isMore: true }
  ];

  const handleNavigation = (item: typeof mainMenuItems[0]) => {
    if (item.isMore) {
      setIsMoreMenuOpen(!isMoreMenuOpen);
    } else {
      navigate(item.path);
      setIsMoreMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">{user?.displayName || 'Kullanıcı'}</span>
        </div>
      </div>

      <div className="lg:pl-64 flex-1">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <nav className="grid grid-cols-5 gap-1">
          {mainMenuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center py-2 ${
                location.pathname === item.path ? 'text-yellow-600' : 'text-gray-600'
              } hover:bg-gray-50`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile More Menu */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed bottom-[4.5rem] left-0 right-0 bg-white border-t border-b shadow-lg">
          <div className="grid grid-cols-2 gap-4 p-4">
            <button
              onClick={() => {
                navigate('/notes');
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm">Notlar</span>
            </button>
            <button
              onClick={() => {
                navigate('/calendar');
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm">Takvim</span>
            </button>
            <button
              onClick={() => {
                navigate('/faq');
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm">Yardım</span>
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm">Ayarlar</span>
            </button>
          </div>
        </div>
      )}

      {/* Add bottom padding for mobile to account for navigation */}
      <div className="lg:hidden h-16" />
    </div>
  );
};