import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Apple as Apps, CreditCard, Clock, StickyNote, 
  Calendar, Settings, HelpCircle, LogOut, Car, Building2 
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const mobileMenuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'services', path: '/services', label: 'Hizmetler', icon: Apps },
    { id: 'vehicles', path: '/vehicles', label: 'Araçlarım', icon: Car },
    { id: 'homes', path: '/homes', label: 'Evlerim', icon: Building2 },
    { id: 'other', path: '/other', label: 'Diğer', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobil Header - Fixed */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">TeknoKapsül</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.displayName || user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Sadece masaüstünde görünür */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Ana İçerik - Mobile header için padding eklendi */}
      <div className="lg:pl-64 pb-16 lg:pb-0 mt-16 lg:mt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Mobil Alt Menü - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-20">
        <div className="grid grid-cols-5">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 ${
                  isActive ? 'text-yellow-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};