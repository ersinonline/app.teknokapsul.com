import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple as Apps, CreditCard, Clock, MoreHorizontal } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mobileMenuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Ana Sayfa', icon: Home },
    { id: 'services', path: '/services', label: 'Hizmetler', icon: Apps },
    { id: 'payments', path: '/payments', label: 'Borçlar', icon: CreditCard },
    { id: 'subscriptions', path: '/subscriptions', label: 'Abonelikler', icon: Clock },
    { id: 'other', path: '/other', label: 'Diğer', icon: MoreHorizontal }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Sadece masaüstünde görünür */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Ana İçerik */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Mobil Alt Menü */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden">
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