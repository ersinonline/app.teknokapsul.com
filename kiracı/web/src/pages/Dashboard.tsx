import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeContracts: number;
  pendingPayments: number;
  overduePayments: number;
  refundedPayments: number;
  upcomingPayments: number;
  paidInvoices: number;
  totalOwed: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
  paymentStatusDistribution: Array<{ status: string; count: number; color: string }>;
  recentActivity: Array<{
    type: string;
    title: string;
    subtitle: string;
    time: string;
    icon: string;
    url: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user, activeRole, tenantContracts } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeContracts: 0,
    pendingPayments: 0,
    overduePayments: 0,
    refundedPayments: 0,
    upcomingPayments: 0,
    paidInvoices: 0,
    totalOwed: 0,
    revenueByMonth: [],
    paymentStatusDistribution: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);

      try {
        let allInvoices: any[] = [];
        let activeContracts = 0;

        if (activeRole === 'tenant') {
          // Tenant: use tenantContracts from AuthContext (avoids collectionGroup permission issues)
          for (const tc of tenantContracts) {
            const ownerUid = tc.ownerUid as string;
            if (!ownerUid) continue;
            if (['ACTIVE', 'EDEVLET_APPROVED'].includes(tc.status)) activeContracts++;
            const invoicesSnap = await getDocs(
              collection(db, 'accounts', ownerUid, 'contracts', tc.id, 'invoices')
            );
            allInvoices.push(...invoicesSnap.docs.map(d => ({
              id: d.id, contractId: tc.id, ownerUid, ...d.data()
            })));
          }
        } else {
          // Landlord: fetch own contracts
          const contractsSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
          activeContracts = contractsSnap.docs.filter(d =>
            ['ACTIVE', 'EDEVLET_APPROVED'].includes(d.data().status)
          ).length;
          for (const contractDoc of contractsSnap.docs) {
            const invoicesSnap = await getDocs(
              collection(db, 'accounts', user.uid, 'contracts', contractDoc.id, 'invoices')
            );
            allInvoices.push(...invoicesSnap.docs.map(d => ({
              id: d.id, contractId: contractDoc.id, ownerUid: user.uid, ...d.data()
            })));
          }
        }

        const totalRevenue = allInvoices
          .filter(inv => inv.status === 'PAID')
          .reduce((sum, inv) => sum + (activeRole === 'tenant' ? (inv.tenantTotal || 0) : (inv.landlordNet || 0)), 0);

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyRevenue = allInvoices
          .filter(inv => inv.status === 'PAID' && inv.period === currentMonth)
          .reduce((sum, inv) => sum + (activeRole === 'tenant' ? (inv.tenantTotal || 0) : (inv.landlordNet || 0)), 0);

        const pendingPayments = allInvoices.filter(inv =>
          ['DUE', 'REFUNDED', 'FAILED', 'PAYMENT_PENDING'].includes(inv.status)
        ).length;
        const overduePayments = allInvoices.filter(inv => {
          if (inv.status === 'OVERDUE') return true;
          if (inv.status !== 'DUE') return false;
          const due = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
          return due && new Date() > due;
        }).length;
        const refundedPayments = allInvoices.filter(inv => inv.status === 'REFUNDED').length;
        const paidInvoices = allInvoices.filter(inv => inv.status === 'PAID').length;

        const totalOwed = allInvoices
          .filter(inv => ['DUE', 'OVERDUE', 'REFUNDED', 'FAILED', 'PAYMENT_PENDING'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.tenantTotal || 0), 0);

        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingPayments = allInvoices.filter(inv => {
          if (inv.status !== 'DUE') return false;
          const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
          return dueDate && dueDate <= nextWeek && dueDate >= now;
        }).length;

        const revenueByMonth: Array<{ month: string; amount: number }> = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
          const amount = allInvoices
            .filter(inv => inv.status === 'PAID' && inv.period === monthKey)
            .reduce((sum, inv) => sum + (activeRole === 'tenant' ? (inv.tenantTotal || 0) : (inv.landlordNet || 0)), 0);
          revenueByMonth.push({ month: monthName, amount });
        }

        const paymentStatusDistribution = [
          { status: 'Ödendi', count: paidInvoices, color: '#10b981' },
          { status: 'Bekliyor', count: pendingPayments, color: '#f59e0b' },
          { status: 'Gecikmiş', count: overduePayments, color: '#ef4444' },
          ...(refundedPayments > 0 ? [{ status: 'İade', count: refundedPayments, color: '#f97316' }] : []),
        ];

        const recentActivity = allInvoices
          .filter(inv => inv.status === 'PAID' && inv.paidAt)
          .sort((a, b) => {
            const aTime = a.paidAt?.toDate ? a.paidAt.toDate().getTime() : 0;
            const bTime = b.paidAt?.toDate ? b.paidAt.toDate().getTime() : 0;
            return bTime - aTime;
          })
          .slice(0, 5)
          .map(inv => ({
            type: 'payment',
            title: activeRole === 'tenant' ? `${inv.period || ''} Ödemesi Yapıldı` : `${inv.period || ''} Ödemesi Alındı`,
            subtitle: `${(inv.tenantTotal || 0).toLocaleString('tr-TR')} ₺`,
            time: inv.paidAt?.toDate ? formatTimeAgo(inv.paidAt.toDate()) : '',
            icon: '✅',
            url: `/contracts/${inv.contractId}`,
          }));

        setStats({
          totalRevenue,
          monthlyRevenue,
          activeContracts,
          pendingPayments,
          overduePayments,
          refundedPayments,
          upcomingPayments,
          paidInvoices,
          totalOwed,
          revenueByMonth,
          paymentStatusDistribution,
          recentActivity,
        });
      } catch (error) {
        console.error('Dashboard stats error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, activeRole]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Az önce';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="spinner h-8 w-8" />
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.amount), 1);
  const isTenant = activeRole === 'tenant';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isTenant ? 'Kiracı Paneli' : 'Ev Sahibi Paneli'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isTenant ? 'Ödeme ve sözleşme durumunuz.' : 'Gelir ve kiracı durumunuz.'}
          </p>
        </div>
      </div>

      {/* Refund Alert */}
      {stats.refundedPayments > 0 && (
        <div className="card border-orange-200 bg-orange-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4m0 0l4-4m-4 4h11.5a4.5 4.5 0 110 9H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-orange-800">{stats.refundedPayments} iade edilmiş ödeme</p>
              <p className="text-xs text-orange-600">iyzico üzerinden iade yapıldı. {isTenant ? 'Tekrar ödeme yapmanız gerekiyor.' : 'Kiracıdan tekrar ödeme istenecek.'}</p>
            </div>
            <Link to="/invoices" className="btn btn-primary text-xs ml-auto shrink-0">Görüntüle</Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {isTenant ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <p className="text-2xl font-bold">{stats.activeContracts}</p>
            <p className="text-sm opacity-90 mt-1">Aktif Sözleşme</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-2xl font-bold">{stats.pendingPayments + stats.overduePayments}</p>
            <p className="text-sm opacity-90 mt-1">Bekleyen Ödeme</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-2xl font-bold">{formatCurrency(stats.totalOwed)}</p>
            <p className="text-sm opacity-90 mt-1">Toplam Borç</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <p className="text-2xl font-bold">{stats.paidInvoices}</p>
            <p className="text-sm opacity-90 mt-1">Ödenen Fatura</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="card p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm opacity-90 mt-1">Toplam Gelir</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-sm opacity-90 mt-1">Bu Ay</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-2xl font-bold">{stats.activeContracts}</p>
            <p className="text-sm opacity-90 mt-1">Aktif Sözleşme</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            <p className="text-sm opacity-90 mt-1">Bekleyen Ödeme</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <p className="text-2xl font-bold">{stats.upcomingPayments}</p>
            <p className="text-sm opacity-90 mt-1">7 Gün İçinde</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue/Payment Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            {isTenant ? 'Ödeme Geçmişi (Son 6 Ay)' : 'Gelir Trendi (Son 6 Ay)'}
          </h3>
          <div className="space-y-4">
            {stats.revenueByMonth.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">{item.month}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.amount / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Fatura Durumu</h3>
          <div className="space-y-4">
            {stats.paymentStatusDistribution.map((item, index) => {
              const total = stats.paymentStatusDistribution.reduce((sum, s) => sum + s.count, 0);
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.status}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
              <p className="text-xs text-slate-500 mt-1">Ödendi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overduePayments}</p>
              <p className="text-xs text-slate-500 mt-1">Gecikmiş</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {formatCurrency(Math.round(stats.monthlyRevenue))}
              </p>
              <p className="text-xs text-slate-500 mt-1">{isTenant ? 'Bu Ay' : 'Aylık Ort.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Son Aktiviteler</h3>
          <Link to="/invoices" className="text-sm text-teal-600 hover:text-teal-700 font-semibold">
            Tümünü Gör →
          </Link>
        </div>

        {stats.recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-slate-500">Henüz aktivite yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <Link
                key={index}
                to={activity.url}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <span className="text-2xl">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{activity.subtitle}</p>
                </div>
                <span className="text-xs text-slate-400">{activity.time}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isTenant ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/invoices" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Ödeme Yap</h4>
            <p className="text-sm text-slate-500">Bekleyen faturalarınızı ödeyin</p>
          </Link>
          <Link to="/contracts" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Sözleşmelerim</h4>
            <p className="text-sm text-slate-500">Aktif sözleşmelerinizi görüntüleyin</p>
          </Link>
          <Link to="/requests" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Taleplerim</h4>
            <p className="text-sm text-slate-500">Talep oluşturun veya yönetin</p>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/contracts/new" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Yeni Sözleşme</h4>
            <p className="text-sm text-slate-500">Kiracı ekle ve sözleşme oluştur</p>
          </Link>
          <Link to="/properties/new" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Yeni Mülk</h4>
            <p className="text-sm text-slate-500">Portföyüne mülk ekle</p>
          </Link>
          <Link to="/wallet" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1M16 12a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Cüzdanım</h4>
            <p className="text-sm text-slate-500">Ödemeler ve bakiye</p>
          </Link>
          <Link to="/requests" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Talepler</h4>
            <p className="text-sm text-slate-500">Kiracı taleplerini yönet</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
