import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Stats {
    totalRevenue: number;
    monthlyRevenue: number;
    activeContracts: number;
    pendingPayments: number;
    paidInvoices: number;
    overdueInvoices: number;
    revenueByMonth: { month: string; amount: number }[];
    paymentStatusDistribution: { status: string; count: number }[];
}

const AnalyticsDashboard: React.FC = () => {
    const { user, activeRole } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeContracts: 0,
        pendingPayments: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        revenueByMonth: [],
        paymentStatusDistribution: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // Contracts
                const contractsSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
                const activeContracts = contractsSnap.docs.filter(d =>
                    ['ACTIVE', 'EDEVLET_APPROVED'].includes(d.data().status)
                ).length;

                // Invoices
                let allInvoices: any[] = [];
                for (const contractDoc of contractsSnap.docs) {
                    const invoicesSnap = await getDocs(
                        collection(db, 'accounts', user.uid, 'contracts', contractDoc.id, 'invoices')
                    );
                    allInvoices.push(...invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }

                const paidInvoices = allInvoices.filter(inv => inv.status === 'PAID').length;
                const overdueInvoices = allInvoices.filter(inv => inv.status === 'OVERDUE').length;
                const pendingPayments = allInvoices.filter(inv => ['DUE', 'OVERDUE'].includes(inv.status)).length;

                // Revenue calculations
                const totalRevenue = allInvoices
                    .filter(inv => inv.status === 'PAID')
                    .reduce((sum, inv) => sum + (inv.landlordNet || 0), 0);

                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const monthlyRevenue = allInvoices
                    .filter(inv => inv.status === 'PAID' && inv.period === currentMonth)
                    .reduce((sum, inv) => sum + (inv.landlordNet || 0), 0);

                // Revenue by month (last 6 months)
                const monthsMap = new Map<string, number>();
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthsMap.set(key, 0);
                }

                allInvoices
                    .filter(inv => inv.status === 'PAID' && inv.period)
                    .forEach(inv => {
                        if (monthsMap.has(inv.period)) {
                            monthsMap.set(inv.period, monthsMap.get(inv.period)! + (inv.landlordNet || 0));
                        }
                    });

                const revenueByMonth = Array.from(monthsMap.entries()).map(([month, amount]) => ({
                    month,
                    amount,
                }));

                // Payment status distribution
                const statusMap = new Map<string, number>();
                allInvoices.forEach(inv => {
                    const status = inv.status || 'UNKNOWN';
                    statusMap.set(status, (statusMap.get(status) || 0) + 1);
                });

                const paymentStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
                    status,
                    count,
                }));

                setStats({
                    totalRevenue,
                    monthlyRevenue,
                    activeContracts,
                    pendingPayments,
                    paidInvoices,
                    overdueInvoices,
                    revenueByMonth,
                    paymentStatusDistribution,
                });
            } catch (error) {
                console.error('Analytics fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="spinner h-8 w-8" />
            </div>
        );
    }

    if (activeRole === 'tenant') {
        return (
            <div className="space-y-6">
                <div className="page-header">
                    <h1 className="page-title">Analizler</h1>
                    <p className="page-subtitle">Kiracı panelinde analizler yakında eklenecek.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const getMonthName = (period: string) => {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    };

    const maxRevenue = Math.max(...stats.revenueByMonth.map(r => r.amount), 1);

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📊 Analizler & Raporlar</h1>
                    <p className="page-subtitle">İşletmenizin performansını takip edin</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Toplam Gelir</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Bu Ay</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Aktif Sözleşme</p>
                            <p className="text-2xl font-bold mt-1">{stats.activeContracts}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Bekleyen Ödeme</p>
                            <p className="text-2xl font-bold mt-1">{stats.pendingPayments}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Son 6 Ay Gelir Trendi</h3>
                    <div className="space-y-4">
                        {stats.revenueByMonth.map((item) => (
                            <div key={item.month}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700">{getMonthName(item.month)}</span>
                                    <span className="text-sm font-bold text-teal-600">{formatCurrency(item.amount)}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                                        style={{ width: `${(item.amount / maxRevenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Status Distribution */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Fatura Durum Dağılımı</h3>
                    <div className="space-y-4">
                        {stats.paymentStatusDistribution.map((item) => {
                            const total = stats.paymentStatusDistribution.reduce((sum, i) => sum + i.count, 0);
                            const percentage = total > 0 ? (item.count / total) * 100 : 0;
                            const statusLabels: Record<string, { label: string; color: string }> = {
                                PAID: { label: 'Ödendi', color: 'bg-green-500' },
                                DUE: { label: 'Ödeme Bekliyor', color: 'bg-blue-500' },
                                OVERDUE: { label: 'Gecikmiş', color: 'bg-red-500' },
                                CLOSED_UPFRONT: { label: 'Peşin Kapatıldı', color: 'bg-purple-500' },
                            };
                            const info = statusLabels[item.status] || { label: item.status, color: 'bg-slate-500' };

                            return (
                                <div key={item.status}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-3 w-3 rounded-full ${info.color}`}></span>
                                            <span className="text-sm font-semibold text-slate-700">{info.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{item.count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${info.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Ödenen Fatura</p>
                            <p className="text-xl font-bold text-slate-900">{stats.paidInvoices}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Gecikmiş Fatura</p>
                            <p className="text-xl font-bold text-slate-900">{stats.overdueInvoices}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Ortalama Aylık</p>
                            <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(stats.totalRevenue / Math.max(stats.revenueByMonth.filter(r => r.amount > 0).length, 1))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
