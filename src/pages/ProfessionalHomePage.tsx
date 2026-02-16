import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Zap, PieChart, Home, Briefcase, TrendingUp, TrendingDown,
  Target, CreditCard, Calculator, BarChart3, Shield, Truck,
  FileText, Calendar, StickyNote, ChevronRight, ArrowUpRight,
  ArrowDownRight, Wallet, Bell, Star, Sparkles
} from 'lucide-react';

const ProfessionalHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi günler');
    else setGreeting('İyi akşamlar');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const expensesRef = collection(db, 'teknokapsul', user.id, 'expenses');
        const expQ = query(expensesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const expSnap = await getDocs(expQ);
        const expenses = expSnap.docs.map(d => d.data());
        const monthExp = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const incomesRef = collection(db, 'teknokapsul', user.id, 'incomes');
        const incQ = query(incomesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const incSnap = await getDocs(incQ);
        const incomes = incSnap.docs.map(d => d.data());
        const monthInc = incomes.filter(i => {
          const d = new Date(i.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        setTotalIncome(monthInc.reduce((s, i) => s + (i.amount || 0), 0));
        setTotalExpense(monthExp.reduce((s, e) => s + (e.amount || 0), 0));
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const netBalance = totalIncome - totalExpense;
  const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long' });

  const quickActions = [
    { icon: Zap, label: 'Kapsülüm', route: '/kapsulum', color: 'bg-amber-500' },
    { icon: Home, label: 'Evim', route: '/evim', color: 'bg-emerald-500' },
    { icon: PieChart, label: 'Bankam', route: '/bankam', color: 'bg-blue-500' },
    { icon: Briefcase, label: 'İşim', route: '/work-tracking', color: 'bg-purple-500' },
  ];

  const financeMenu = [
    { icon: TrendingUp, label: 'Gelirlerim', route: '/income', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: TrendingDown, label: 'Giderlerim', route: '/expenses', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Target, label: 'Hedeflerim', route: '/goals', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: PieChart, label: 'Portföyüm', route: '/portfolio', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: BarChart3, label: 'Borsa', route: '/stock-market', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { icon: Calculator, label: 'Kredi Hesaplama', route: '/credit-calculator', color: 'text-teal-500', bg: 'bg-teal-50' },
    { icon: CreditCard, label: 'Kredi Notu', route: '/credit-score', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Calendar, label: 'Ödeme Planı', route: '/payment-plan', color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  const lifeMenu = [
    { icon: Shield, label: 'Garanti Takibi', route: '/warranty-tracking', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Truck, label: 'Kargo Takibi', route: '/cargo-tracking', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Star, label: 'Abonelikler', route: '/subscriptions', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: StickyNote, label: 'Notlarım', route: '/notes', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Calendar, label: 'Takvimim', route: '/calendar', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: FileText, label: 'Belgelerim', route: '/documents', color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="page-container bg-background">
      {/* ===== HERO HEADER ===== */}
      <div className="bank-gradient px-4 pt-6 pb-10 md:pt-8 md:pb-14">
        <div className="page-content">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm">{greeting}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">
                {user?.firstName || 'Kullanıcı'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/notifications')}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Bell className="w-5 h-5 text-white/80" />
              </button>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-white/80" />
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider font-medium">{monthName} Net Bakiye</p>
                <p className={`text-3xl font-bold mt-1 ${netBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
                  {loading ? (
                    <span className="inline-block w-32 h-8 skeleton rounded-lg" />
                  ) : formatCurrency(netBalance)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bank-gradient-gold flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-white/60 text-[11px] uppercase tracking-wider">Gelir</span>
                </div>
                <p className="text-white font-bold text-sm">
                  {loading ? <span className="inline-block w-20 h-4 skeleton rounded" /> : formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-300" />
                  <span className="text-white/60 text-[11px] uppercase tracking-wider">Gider</span>
                </div>
                <p className="text-white font-bold text-sm">
                  {loading ? <span className="inline-block w-20 h-4 skeleton rounded" /> : formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="page-content -mt-5">
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.route}
                onClick={() => navigate(action.route)}
                className={`bank-card bank-card-interactive p-3 flex flex-col items-center gap-2 animate-fade-in stagger-${i + 1}`}
              >
                <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== FINANCE SECTION ===== */}
      <div className="page-content mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Finansal Araçlar</h2>
          <button onClick={() => navigate('/bankam')} className="text-xs font-medium text-primary flex items-center gap-0.5">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bank-card p-1">
          {financeMenu.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="menu-item w-full"
              >
                <div className={`menu-icon ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== LIFE SECTION ===== */}
      <div className="page-content mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Yaşam</h2>
          <button onClick={() => navigate('/evim')} className="text-xs font-medium text-primary flex items-center gap-0.5">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bank-card p-1">
          {lifeMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="menu-item w-full"
              >
                <div className={`menu-icon ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalHomePage;