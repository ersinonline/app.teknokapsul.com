import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ accounts: 0, contracts: 0, activeContracts: 0, pendingPayouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const accountsSnap = await getDocs(collection(db, 'accounts'));
        const contractsSnap = await getDocs(collectionGroup(db, 'contracts'));
        const activeCount = contractsSnap.docs.filter((d) => d.data().status === 'ACTIVE').length;
        const payoutsSnap = await getDocs(query(collectionGroup(db, 'payouts'), where('status', '==', 'PLANNED')));
        setStats({
          accounts: accountsSnap.size,
          contracts: contractsSnap.size,
          activeContracts: activeCount,
          pendingPayouts: payoutsSnap.size,
        });
      } catch (e) {
        console.error('Admin stats error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { label: 'Hesaplar', value: stats.accounts, color: 'text-slate-900' },
    { label: 'Toplam Sözleşme', value: stats.contracts, color: 'text-slate-900' },
    { label: 'Aktif Kira', value: stats.activeContracts, color: 'text-emerald-600' },
    { label: 'Bekleyen Aktarım', value: stats.pendingPayouts, color: stats.pendingPayouts > 0 ? 'text-amber-600' : 'text-slate-900' },
  ];

  const tools = [
    { to: '/admin/contracts', title: 'Sözleşmeler', desc: 'Tüm sözleşmeleri listele ve incele.', accent: 'bg-sky-50 text-sky-600', icon: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z' },
    { to: '/admin/payments', title: 'Ödemeler', desc: 'Fatura ve ödeme kayıtlarını görüntüle.', accent: 'bg-amber-50 text-amber-600', icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 9h18' },
    { to: '/admin/payouts', title: 'Aktarımlar', desc: 'Bekleyen aktarımları onayla ve takip et.', accent: 'bg-emerald-50 text-emerald-600', icon: 'M7 7h11l-3-3m3 13H7l3 3' },
    { to: '/admin/holidays', title: 'Tatiller', desc: 'Resmi tatil günlerini yönet.', accent: 'bg-violet-50 text-violet-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/admin/audit', title: 'Denetim Logları', desc: 'Kullanıcı işlemlerini incele.', accent: 'bg-red-50 text-red-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Admin Paneli</h1>
          <p className="page-subtitle">Sözleşme, ödeme ve payout süreçlerini tek ekrandan yönetin.</p>
        </div>

        <AdminNav />

        {loading ? (
          <div className="flex items-center justify-center py-12"><span className="spinner h-8 w-8" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {statItems.map((s) => (
                <div key={s.label} className="stat-card text-center">
                  <div className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <Link key={t.to} to={t.to} className="card p-5 flex items-start gap-4 group hover:-translate-y-0.5 transition-transform">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.accent} transition-transform group-hover:scale-110`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;
