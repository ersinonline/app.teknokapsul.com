import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  PieChart,
  Zap,
  Briefcase,
  Home,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
}

const navItems: NavigationItem[] = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/kapsulum', label: 'Kapsülüm', icon: Zap },
  { path: '/evim', label: 'Evim', icon: Home },
  { path: '/bankam', label: 'Bankam', icon: PieChart },
  { path: '/work-tracking', label: 'İşim', icon: Briefcase },
];

const pageTitles: Record<string, string> = {
  '/': 'TeknoKapsül',
  '/kapsulum': 'Kapsülüm',
  '/evim': 'Evim',
  '/bankam': 'Bankam',
  '/work-tracking': 'İşim',
  '/income': 'Gelirlerim',
  '/expenses': 'Giderlerim',
  '/goals': 'Hedeflerim',
  '/budget': 'Bütçem',
  '/portfolio': 'Portföyüm',
  '/stock-market': 'Borsa',
  '/financial-data': 'Finansal Veriler',
  '/credit-score': 'Kredi Notu',
  '/credit-calculator': 'Kredi Hesaplama',
  '/payment-plan': 'Ödeme Planı',
  '/subscriptions': 'Abonelikler',
  '/cargo-tracking': 'Kargo Takibi',
  '/warranty-tracking': 'Garanti Takibi',
  '/calendar': 'Takvim',
  '/notes': 'Notlar',
  '/documents': 'Belgeler',
  '/notifications': 'Bildirimler',
  '/settings': 'Ayarlar',
  '/ai-assistant': 'AI Asistan',
  '/analytics': 'Analitik',
  '/accounts': 'Hesaplar',
  '/all-transactions': 'Tüm İşlemler',
  '/applications': 'Başvurular',
  '/attendance': 'Yoklama',
  '/pharmacy': 'Eczane',
};

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isHomePage = location.pathname === '/';
  const isSubPage = !navItems.some(item => item.path === location.pathname);
  const currentTitle = pageTitles[location.pathname] || 'TeknoKapsül';

  useEffect(() => {
    if (!user) return;
    const notificationsRef = collection(db, 'teknokapsul', user.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <>
      {/* ===== DESKTOP TOP NAV ===== */}
      <div className="top-nav">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.ico" alt="TeknoKapsül" className="w-8 h-8" />
            <span className="text-base font-bold text-foreground">TeknoKapsül</span>
          </button>
          <div className="w-px h-6 bg-border/60 mx-1" />
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-xl object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#ffb700] flex items-center justify-center text-white font-bold text-xs">
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* ===== MOBILE HEADER ===== */}
      {!isHomePage && (
        <div className="md:hidden page-header">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {isSubPage && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              <h1 className="text-lg font-bold text-foreground">{currentTitle}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2.5 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-xl object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#ffb700] flex items-center justify-center text-white font-bold text-xs">
                  {user?.displayName?.[0] || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="bottom-nav">
        <div className="grid grid-cols-5 px-2 py-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className={`relative ${isActive ? '' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};