import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Home, CreditCard, Apple as Apps, Clock, MoreHorizontal } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const mobileMenuItems = [
    { icon: Home, label: 'Ana Sayfa', path: '/dashboard' },
    { icon: Apps, label: 'Hizmetler', path: '/services' },
    { icon: CreditCard, label: 'Borçlar', path: '/payments' },
    { icon: Clock, label: 'Abonelikler', path: '/subscriptions' },
    { icon: MoreHorizontal, label: 'Diğer', path: '/more' }
  ];

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
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

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
        <div className="grid grid-cols-5 gap-1">
          {mobileMenuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-2 hover:bg-gray-50"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding for mobile to account for navigation */}
      <div className="lg:hidden h-16" />
    </div>
  );
};