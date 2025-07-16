import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import Sidebar from './Sidebar';
import { TabletNavigation } from '../navigation/TabletNavigation';
import { ChatButton } from '../chat/ChatButton';
import { MaintenanceBanner } from '../common/MaintenanceBanner';
import { OfflineIndicator } from '../common/OfflineIndicator';

import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Scroll position management
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const mobileMenuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'income', path: '/income', label: 'Gelirlerim', icon: TrendingUp },
    { id: 'expenses', path: '/expenses', label: 'Giderlerim', icon: TrendingDown },
    { id: 'budget', path: '/budget', label: 'Bütçe', icon: Wallet },
    { id: 'goals', path: '/goals', label: 'Hedefler', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Maintenance Banner */}
      <MaintenanceBanner />
      
      {/* Tablet Navigation - Medium to Large screens */}
      <TabletNavigation className="hidden md:block xl:hidden fixed top-0 left-0 right-0 z-20" />
      
      {/* Mobile Header - Small screens only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">TeknoKapsül</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Masaüstü ve büyük tabletlerde görünür */}
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      {/* Ana İçerik - Responsive padding */}
      <div className={`${sidebarCollapsed ? 'xl:pl-20' : 'xl:pl-64'} pb-16 md:pb-0 xl:pb-0 pt-16 md:pt-16 xl:pt-0 transition-all duration-300`}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-8">
          {children}
        </div>
      </div>

      {/* Mobil Alt Menü - Fixed - Sadece küçük ekranlar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-20">
        <div className="grid grid-cols-5">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-3 px-2 ${
                  isActive ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600'
                } hover:bg-gray-50 transition-colors`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chat Button */}
      <ChatButton />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      

    </div>
  );
};