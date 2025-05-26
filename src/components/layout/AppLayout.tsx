import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Apple as Apps, Clock, MoreHorizontal, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems = [
    { icon: Home, label: 'Ana Sayfa', path: '/dashboard' },
    { icon: Apps, label: 'Hizmetler', path: '/services' },
    { icon: CreditCard, label: 'Borçlar', path: '/payments' },
    { icon: Clock, label: 'Abonelikler', path: '/subscriptions' },
    { icon: MoreHorizontal, label: 'Diğer', path: '/other' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMoreMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <span className="text-lg font-semibold">TeknoKapsül</span>
        <button
          onClick={handleLogout}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="pb-16 lg:pb-0">
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
              onClick={() => handleNavigation(item.path)}
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
    </div>
  );
};