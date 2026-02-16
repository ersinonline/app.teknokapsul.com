import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNotifications } from '../context/NotificationContext';

const NavIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'h-5 w-5' }) => {
  const icons: Record<string, string> = {
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    home: 'M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
    doc: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z',
    card: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 9h18',
    bell: 'M15 17H9a4 4 0 01-4-4V9a7 7 0 0114 0v4a4 4 0 01-4 4zM9 17a3 3 0 006 0',
    alert: 'M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 19h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.72 0z',
    transfer: 'M7 7h11l-3-3m3 13H7l3 3',
    shield: 'M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z',
    wallet: 'M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1M16 12a1 1 0 100-2 1 1 0 000 2z',
    swap: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || ''} />
    </svg>
  );
};

const Layout: React.FC = () => {
  const { user, signOut, activeRole, switchRole, memberData, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');

  const displayName = memberData?.displayName || user?.displayName || '';
  useEffect(() => {
    if (!user) return;
    const missing = !(memberData?.displayName || user.displayName);
    setProfileOpen(missing);
    setDisplayNameInput(memberData?.displayName || user.displayName || '');
  }, [memberData, user]);

  const navItems = useMemo(() => {
    if (!user) return [];

    if (activeRole === 'tenant') {
      return [
        { to: '/dashboard', label: 'Panel', icon: 'grid' },
        { to: '/contracts', label: 'Sözleşmelerim', icon: 'doc' },
        { to: '/invoices', label: 'Ödemelerim', icon: 'card' },
        { to: '/requests', label: 'Talepler', icon: 'bell' },
      ];
    }

    // Landlord menu
    const items = [
      { to: '/dashboard', label: 'Panel', icon: 'grid' },
      { to: '/properties', label: 'Taşınmazlar', icon: 'home' },
      { to: '/contracts', label: 'Sözleşmeler', icon: 'doc' },
      { to: '/wallet', label: 'Cüzdanım', icon: 'wallet' },
      { to: '/requests', label: 'Talepler', icon: 'bell' },
    ];
    return items;
  }, [user, activeRole, isAdmin]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleSwitchRole = () => {
    const next = activeRole === 'landlord' ? 'tenant' : 'landlord';
    switchRole(next);
    navigate('/dashboard');
  };

  const saveDisplayName = async () => {
    if (!user) return;
    const next = displayNameInput.trim();
    if (!next) return;
    await updateProfile(user, { displayName: next });
    await setDoc(
      doc(db, 'accounts', user.uid, 'members', user.uid),
      { displayName: next, updatedAt: new Date() },
      { merge: true }
    );
    setProfileOpen(false);
  };

  const roleBadge = activeRole === 'landlord'
    ? { label: 'Ev Sahibi', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
    : { label: 'Kiracı', bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' };

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="app-container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 font-semibold text-slate-900 group">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-600 text-white text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
                  eK
                </span>
                <span className="text-lg hidden sm:inline">eKira</span>
              </Link>

              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={handleSwitchRole}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${roleBadge.bg}`}
                    title={`Tıklayın: ${activeRole === 'landlord' ? 'Kiracı' : 'Ev Sahibi'} paneline geç`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`} />
                    {roleBadge.label}
                    <NavIcon name="swap" className="h-3 w-3 ml-0.5 opacity-60" />
                  </button>
                </div>
              )}

              {user && (
                <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-xl transition-colors ${isActive(item.to)
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 text-sm">
                  <Link to="/notifications" className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="hidden md:flex items-center gap-2 text-slate-600">
                    <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {(displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                    <span className="hidden xl:inline max-w-[140px] truncate">{displayName || user.email}</span>
                  </div>
                  <button onClick={() => signOut()} className="btn btn-secondary text-xs px-3 py-1.5">
                    Çıkış
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn btn-ghost text-sm">Giriş Yap</Link>
                  <Link to="/register" className="btn btn-primary text-sm">Kayıt Ol</Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </header>

      <main className={`flex-1 app-container page-wrap ${user ? 'pb-24 md:pb-8' : ''}`}>
        <Outlet />
      </main>

      {user && navItems.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg md:hidden safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-1.5">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center rounded-2xl px-1 py-1.5 min-w-0 flex-1 transition-colors ${active ? 'text-teal-700' : 'text-slate-500'
                    }`}
                >
                  <span className={`mb-0.5 ${active ? 'text-teal-600' : 'text-slate-400'}`}>
                    <NavIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className={`text-[10px] font-semibold truncate ${active ? 'text-teal-700' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                  {active && <span className="mt-0.5 h-1 w-1 rounded-full bg-teal-600" />}
                </Link>
              );
            })}
            {/* Role switcher in bottom bar */}
            <button
              onClick={handleSwitchRole}
              className="flex flex-col items-center justify-center rounded-2xl px-1 py-1.5 min-w-0 flex-1 text-slate-500"
            >
              <span className={`mb-0.5 ${activeRole === 'landlord' ? 'text-emerald-500' : 'text-sky-500'}`}>
                <NavIcon name="swap" className="h-5 w-5" />
              </span>
              <span className={`text-[10px] font-semibold ${activeRole === 'landlord' ? 'text-emerald-600' : 'text-sky-600'}`}>
                {activeRole === 'landlord' ? 'Kiracı' : 'Ev Sahibi'}
              </span>
            </button>
          </div>
        </nav>
      )}

      <footer className="hidden md:block border-t border-slate-200/70 bg-white">
        <div className="app-container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white text-xs font-bold shadow-sm">eK</span>
                <span className="text-base font-bold text-slate-900">eKira</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">Kira süreçlerinizi uçtan uca dijital ortamda yönetin.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/dashboard" className="hover:text-teal-700 transition-colors">Panel</Link></li>
                <li><Link to="/contracts" className="hover:text-teal-700 transition-colors">Sözleşmeler</Link></li>
                <li><Link to="/properties" className="hover:text-teal-700 transition-colors">Taşınmazlar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Güvenlik</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Güvenli Ödeme (iyzico)</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />e-Devlet Uyumlu</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />KVKK Uyumlu</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">İletişim</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>info@teknotech.info</li>
                <li>Türkiye geneli hizmet</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>&copy; 2026 eKira. Tüm hakları saklıdır.</p>
            <p>Güvenli altyapı ile korunmaktadır.</p>
          </div>
        </div>
      </footer>

      {profileOpen && user && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold text-slate-900">Profil Bilgisi</h3>
            <p className="mt-2 text-sm text-slate-600">Hesabınızı tamamlamak için ad soyad girin.</p>
            <div className="mt-4 form-group">
              <label className="form-label">Ad Soyad</label>
              <input
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveDisplayName()}
                className="form-input"
                placeholder="Ad Soyad"
                autoFocus
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveDisplayName} className="btn btn-primary flex-1">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
