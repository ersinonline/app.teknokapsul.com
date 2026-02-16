import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface DashboardStats {
    totalRevenue: number;
    monthlyRevenue: number;
    activeContracts: number;
    pendingPayments: number;
    upcomingPayments: number;
    recentActivity: Array<{
        type: string;
        title: string;
        subtitle: string;
        time: string;
        icon: string;
        url: string;
    }>;
}

const EnhancedDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeContracts: 0,
        pendingPayments: 0,
        upcomingPayments: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // Fetch contracts
                const contractsSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
                const activeContracts = contractsSnap.docs.filter(d =>
                    ['ACTIVE', 'EDEVLET_APPROVED'].includes(d.data().status)
                ).length;

                // Fetch all invoices
                let allInvoices: any[] = [];
                for (const contractDoc of contractsSnap.docs) {
                    const invoicesSnap = await getDocs(
                        collection(db, 'accounts', user.uid, 'contracts', contractDoc.id, 'invoices')
                    );
                    allInvoices.push(...invoicesSnap.docs.map(d => ({
                        id: d.id,
                        contractId: contractDoc.id,
                        ...d.data()
                    })));
                }

                // Calculate stats
                const totalRevenue = allInvoices
                    .filter(inv => inv.status === 'PAID')
                    .reduce((sum, inv) => sum + (inv.landlordNet || 0), 0);

                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const monthlyRevenue = allInvoices
                    .filter(inv => inv.status === 'PAID' && inv.period === currentMonth)
                    .reduce((sum, inv) => sum + (inv.landlordNet || 0), 0);

                const pendingPayments = allInvoices.filter(inv =>
                    ['DUE', 'OVERDUE', 'REFUNDED', 'FAILED', 'PAYMENT_PENDING'].includes(inv.status)
                ).length;

                // Upcoming payments (next 7 days)
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const upcomingPayments = allInvoices.filter(inv => {
                    if (inv.status !== 'DUE') return false;
                    const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
                    return dueDate && dueDate <= nextWeek && dueDate >= now;
                }).length;

                // Recent activity
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
                        title: `${inv.period || ''} Ödemesi Alındı`,
                        subtitle: `${inv.tenantTotal || 0} ₺`,
                        time: inv.paidAt?.toDate ? formatTimeAgo(inv.paidAt.toDate()) : '',
                        icon: '✅',
                        url: `/contracts/${inv.contractId}`,
                    }));

                setStats({
                    totalRevenue,
                    monthlyRevenue,
                    activeContracts,
                    pendingPayments,
                    upcomingPayments,
                    recentActivity,
                });
            } catch (error) {
                console.error('Dashboard stats error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Az önce';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="spinner h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm opacity-90 mt-1">Toplam Gelir</p>
                </div>

                <div className="card p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-sm opacity-90 mt-1">Bu Ay</p>
                </div>

                <div className="card p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.activeContracts}</p>
                    <p className="text-sm opacity-90 mt-1">Aktif Sözleşme</p>
                </div>

                <div className="card p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                    <p className="text-sm opacity-90 mt-1">Bekleyen Ödeme</p>
                </div>

                <div className="card p-5 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{stats.upcomingPayments}</p>
                    <p className="text-sm opacity-90 mt-1">7 Gün İçinde</p>
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
                                    <p className="text-sm font-semibold text-slate-900">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {activity.subtitle}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {activity.time}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                    to="/contracts/new"
                    className="card p-6 hover:shadow-lg transition-shadow group"
                >
                    <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Yeni Sözleşme</h4>
                    <p className="text-sm text-slate-500">Kiracı ekle ve sözleşme oluştur</p>
                </Link>

                <Link
                    to="/properties/new"
                    className="card p-6 hover:shadow-lg transition-shadow group"
                >
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Yeni Mülk</h4>
                    <p className="text-sm text-slate-500">Portföyüne mülk ekle</p>
                </Link>

                <Link
                    to="/analytics"
                    className="card p-6 hover:shadow-lg transition-shadow group"
                >
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Raporlar</h4>
                    <p className="text-sm text-slate-500">Gelir ve performans analizi</p>
                </Link>

                <Link
                    to="/quick-pay-qr"
                    className="card p-6 hover:shadow-lg transition-shadow group"
                >
                    <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">QR Ödeme</h4>
                    <p className="text-sm text-slate-500">Hızlı ödeme linki oluştur</p>
                </Link>
            </div>
        </div>
    );
};

export default EnhancedDashboard;
