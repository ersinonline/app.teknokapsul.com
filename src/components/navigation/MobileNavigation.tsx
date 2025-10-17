import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
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
import { UserButton } from '@clerk/clerk-react';

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
                 onClick={() => navigate('/')}
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

            <UserButton />
          </div>
        </div>
      </div>



      {/* Top Navigation for Tablet and Desktop */}
      {!isHomePage && (
        <div className="hidden md:block fixed top-0 left-0 right-0 glass z-50 border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3">
              <img src="/logo.ico" alt="TeknoKapsül" className="w-10 h-10 object-contain animate-bounce-in" />
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity group"
              >
                <h1 className="text-xl font-bold text-gradient">TeknoKapsül</h1>
              </button>
            </div>
            
            {/* Center - Navigation Items */}
            <div className="flex items-center space-x-2 glass-card p-2 rounded-xl">
              {bottomNavigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path}`}
                    className={`
                      flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-glow-gold' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Right side - User actions */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleNotificationClick}
                className="relative p-3 rounded-xl glass-card hover-lift"
              >
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg animate-pulse-soft">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="glass-card p-1 rounded-xl">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 rounded-lg",
                      userButtonPopoverCard: "rounded-[12px]",
                      userButtonPopoverActionButton: "rounded-[10px]"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile Only */}
      {!isHomePage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass z-50 border-t border-white/20">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          {bottomNavigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.path}`}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-glow-gold scale-105' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30'
                  }
                `}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-bounce-in' : ''}`} />
                <span className={`text-xs font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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