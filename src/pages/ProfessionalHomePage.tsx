import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Zap, PieChart, Home, Briefcase, TrendingUp, TrendingDown,
  Target, CreditCard, Calculator, BarChart3, Shield, Truck,
  FileText, Calendar, StickyNote, ChevronRight, ArrowUpRight,
  ArrowDownRight, Wallet, Bell, Star, Sparkles, Wrench,
  Globe, Activity, DollarSign, Clock, Award, Rocket,
  ShoppingBag, MessageCircle, Headphones
} from 'lucide-react';

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 1500, start: number = 0) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (end === start) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      countRef.current = start + (end - start) * eased;
      setCount(Math.round(countRef.current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration, start]);

  return count;
};

const ProfessionalHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePromo, setActivePromo] = useState(0);

  const animatedIncome = useAnimatedCounter(loading ? 0 : totalIncome, 2000);
  const animatedExpense = useAnimatedCounter(loading ? 0 : totalExpense, 2000);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('İyi geceler');
    else if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi günler');
    else setGreeting('İyi akşamlar');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setActivePromo(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(promoTimer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) { setLoading(false); return; }
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const expensesRef = collection(db, 'teknokapsul', user.uid, 'expenses');
        const expQ = query(expensesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const expSnap = await getDocs(expQ);
        const expenses = expSnap.docs.map(d => d.data());
        const monthExp = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const incomesRef = collection(db, 'teknokapsul', user.uid, 'incomes');
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
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  const quickActions = [
    { icon: Zap, label: 'Kapsülüm', route: '/kapsulum', color: 'from-amber-400 to-amber-600' },
    { icon: Home, label: 'Evim', route: '/evim', color: 'from-emerald-400 to-emerald-600' },
    { icon: PieChart, label: 'Bankam', route: '/bankam', color: 'from-blue-400 to-blue-600' },
    { icon: Briefcase, label: 'İşim', route: '/work-tracking', color: 'from-purple-400 to-purple-600' },
    { icon: Wrench, label: 'Hizmetler', route: '/tekno-hizmet', color: 'from-teal-400 to-teal-600' },
    { icon: ShoppingBag, label: 'Dijital', route: '/dijital-kodlar', color: 'from-pink-400 to-pink-600' },
    { icon: Sparkles, label: 'AI Asistan', route: '/ai-assistant', color: 'from-indigo-400 to-violet-600' },
    { icon: Headphones, label: 'Destek', route: '/support', color: 'from-gray-400 to-gray-600' },
  ];

  const promos = [
    { title: 'TeknoHizmet ile 200+ Hizmet', desc: 'İnternet, sigorta, teknik servis ve daha fazlası', gradient: 'from-emerald-500 to-teal-600', icon: Globe },
    { title: 'AI Finansal Asistan', desc: 'Yapay zeka ile bütçenizi optimize edin', gradient: 'from-violet-500 to-purple-600', icon: Sparkles },
    { title: 'Dijital Kod Mağazası', desc: 'Oyun kodları, hediye kartları anında teslimat', gradient: 'from-pink-500 to-rose-600', icon: Rocket },
  ];

  const financeMenu = [
    { icon: TrendingUp, label: 'Gelirlerim', route: '/income', color: 'text-emerald-500', bg: 'bg-emerald-50', badge: null },
    { icon: TrendingDown, label: 'Giderlerim', route: '/expenses', color: 'text-red-500', bg: 'bg-red-50', badge: null },
    { icon: Target, label: 'Hedeflerim', route: '/goals', color: 'text-blue-500', bg: 'bg-blue-50', badge: null },
    { icon: PieChart, label: 'Portföyüm', route: '/portfolio', color: 'text-purple-500', bg: 'bg-purple-50', badge: null },
    { icon: BarChart3, label: 'Borsa', route: '/stock-market', color: 'text-indigo-500', bg: 'bg-indigo-50', badge: 'Canlı' },
    { icon: Calculator, label: 'Kredi Hesaplama', route: '/credit-calculator', color: 'text-teal-500', bg: 'bg-teal-50', badge: null },
    { icon: CreditCard, label: 'Kredi Notu', route: '/credit-score', color: 'text-amber-500', bg: 'bg-amber-50', badge: null },
    { icon: Calendar, label: 'Ödeme Planı', route: '/payment-plan', color: 'text-pink-500', bg: 'bg-pink-50', badge: null },
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
      <div className="relative overflow-hidden">
        <div className="bank-gradient px-4 pt-6 pb-12 md:pt-8 md:pb-16">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          
          <div className="page-content relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/70 text-sm">{greeting}</p>
                  <span className="text-white/40 text-xs">
                    {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h1 className="text-white text-2xl font-bold">
                  {user?.displayName?.split(' ')[0] || 'Kullanıcı'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  <Bell className="w-5 h-5 text-white/80" />
                </button>
                <button
                  onClick={() => navigate('/ai-assistant')}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center hover:from-violet-500/50 hover:to-purple-500/50 transition-all duration-300 hover:scale-105 border border-white/10"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider font-medium">{monthName} Net Bakiye</p>
                  <p className={`text-3xl font-bold mt-1 ${netBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
                    {loading ? (
                      <span className="inline-block w-32 h-8 skeleton rounded-lg" />
                    ) : formatCurrency(netBalance)}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  {!loading && totalIncome > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${savingsRate >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                      {savingsRate >= 0 ? '+' : ''}{savingsRate}%
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors cursor-pointer" onClick={() => navigate('/income')}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-white/60 text-[11px] uppercase tracking-wider">Gelir</span>
                  </div>
                  <p className="text-white font-bold text-sm">
                    {loading ? <span className="inline-block w-20 h-4 skeleton rounded" /> : formatCurrency(animatedIncome)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors cursor-pointer" onClick={() => navigate('/expenses')}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-300" />
                    <span className="text-white/60 text-[11px] uppercase tracking-wider">Gider</span>
                  </div>
                  <p className="text-white font-bold text-sm">
                    {loading ? <span className="inline-block w-20 h-4 skeleton rounded" /> : formatCurrency(animatedExpense)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="page-content -mt-6">
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.route}
                onClick={() => navigate(action.route)}
                className="bank-card bank-card-interactive p-3 flex flex-col items-center gap-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-11 h-11 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== PROMO BANNER ===== */}
      <div className="page-content mt-5">
        <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ minHeight: '100px' }}>
          {promos.map((promo, i) => {
            const PromoIcon = promo.icon;
            return (
              <div
                key={i}
                className={`absolute inset-0 bg-gradient-to-r ${promo.gradient} p-5 flex items-center justify-between transition-all duration-700 ${
                  activePromo === i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base mb-1">{promo.title}</h3>
                  <p className="text-white/80 text-xs">{promo.desc}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center ml-3">
                  <PromoIcon className="w-7 h-7 text-white" />
                </div>
              </div>
            );
          })}
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePromo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  activePromo === i ? 'bg-white w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== PLATFORM STATS ===== */}
      <div className="page-content mt-5">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bank-card p-3 text-center">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-foreground">200+</p>
            <p className="text-[10px] text-muted-foreground">Hizmet</p>
          </div>
          <div className="bank-card p-3 text-center">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-foreground">50+</p>
            <p className="text-[10px] text-muted-foreground">Finans Aracı</p>
          </div>
          <div className="bank-card p-3 text-center">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Award className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-lg font-bold text-foreground">7/24</p>
            <p className="text-[10px] text-muted-foreground">AI Destek</p>
          </div>
        </div>
      </div>

      {/* ===== FINANCE SECTION ===== */}
      <div className="page-content mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Finansal Araçlar
          </h2>
          <button onClick={() => navigate('/bankam')} className="text-xs font-medium text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all">
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bank-card p-1">
          {financeMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="menu-item w-full group"
              >
                <div className={`menu-icon ${item.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full mr-1 animate-pulse">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== LIFE SECTION ===== */}
      <div className="page-content mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Yaşam
          </h2>
          <button onClick={() => navigate('/evim')} className="text-xs font-medium text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all">
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
                className="menu-item w-full group"
              >
                <div className={`menu-icon ${item.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== AI ASSISTANT CTA ===== */}
      <div className="page-content mt-5 mb-6">
        <button
          onClick={() => navigate('/ai-assistant')}
          className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5 group"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-white font-bold text-base">TeknoAI Asistan</h3>
            <p className="text-white/70 text-xs mt-0.5">Yapay zeka destekli kişisel finans danışmanınız</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ===== FOOTER INFO ===== */}
      <div className="page-content mb-8">
        <div className="text-center py-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">TeknoKapsül</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Dijital yaşamınızın tek adresi</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> v2.5.0
            </span>
            <span className="text-[9px] text-muted-foreground">
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalHomePage;