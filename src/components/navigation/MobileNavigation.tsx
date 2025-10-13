import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  PieChart,
  Zap,
  Briefcase,
  Building
} from 'lucide-react';
// import { usePremium } from '../../contexts/PremiumContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const bottomNavigationItems: NavigationItem[] = [
  { path: '/kapsulum', label: 'Kapsülüm', icon: Zap },
  { path: '/evim', label: 'Evim', icon: Building },
  { path: '/bankam', label: 'Bankam', icon: PieChart },
  { path: '/work-tracking', label: 'İşim', icon: Briefcase },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const { isPremium } = usePremium();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Ana sayfada mobil alt menüyü gizle
  const isHomePage = location.pathname === '/';

  const handleUserClick = () => {
    // Clerk ayarları sayfasını aç
    window.open('https://accounts.clerk.dev/user', '_blank');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'teknokapsul', user.id, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      {/* Mobile Header - Tamamen gizli */}
      <div className="hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-lg font-semibold text-gray-900">TeknoKapsül</h1>
              <p className="text-xs text-gray-500">Dijital Çözümler</p>
              {/* {isPremium && (
                <img src="https://i.hizliresim.com/indgl7s.png" alt="TeknoKapsül" className="h-4 object-contain" />
              )} */}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleNotificationClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={handleUserClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>



      {/* Bottom Navigation for All Devices */}
      {!isHomePage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {bottomNavigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'text-[#ffb700] bg-[#ffb700]/10' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      )}

    </>
  );
};