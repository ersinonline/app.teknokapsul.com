import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db, auth } from '../../firebase';
import { collectionGroup, getDocs, limit, query } from 'firebase/firestore';
import { invoiceStatusLabel } from '../../utils/status';
import { toast } from '../../components/Toast';

const REFUND_URL = 'https://us-central1-superapp-37db4.cloudfunctions.net/adminRefundPayment';
const STATUS_URL = 'https://us-central1-superapp-37db4.cloudfunctions.net/adminUpdateInvoiceStatus';

const ALL_STATUSES = [
  { value: 'DUE', label: 'Ödeme Bekliyor' },
  { value: 'OVERDUE', label: 'Gecikmiş' },
  { value: 'PAID', label: 'Ödendi' },
  { value: 'PAYMENT_PENDING', label: 'İşleniyor' },
  { value: 'FAILED', label: 'Başarısız' },
  { value: 'REFUNDED', label: 'İade Edildi' },
  { value: 'CLOSED_UPFRONT', label: 'Peşin Ödendi' },
];

type InvoiceRow = {
  id: string;
  period?: string;
  tenantTotal?: number;
  status?: string;
  iyzico?: { checkoutToken?: string; paymentId?: string };
  tenantEmail?: string;
  ownerUid?: string;
  contractId?: string;
};

const AdminPayments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collectionGroup(db, 'invoices'), limit(100));
      const snap = await getDocs(q);
      setItems(
        snap.docs.map((d) => {
          const parts = d.ref.path.split('/');
          return {
            id: d.id,
            ownerUid: parts[1],
            contractId: parts[3],
            ...(d.data() as any),
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Oturum bulunamadı.');
    return token;
  };

  const handleRefund = async (inv: InvoiceRow) => {
    if (!confirm(`${inv.period} — ${inv.tenantEmail}\n\nBu ödemeyi iyzico üzerinden iade etmek istediğinize emin misiniz?`)) return;
    const key = `${inv.ownerUid}:${inv.contractId}:${inv.id}`;
    setBusyId(key);
    try {
      const token = await getToken();
      const resp = await fetch(REFUND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerUid: inv.ownerUid, contractId: inv.contractId, invoiceId: inv.id }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success('İade başarılı! Fatura durumu REFUNDED olarak güncellendi.');
        setItems((prev) => prev.map((x) =>
          x.id === inv.id && x.ownerUid === inv.ownerUid && x.contractId === inv.contractId
            ? { ...x, status: 'REFUNDED' } : x
        ));
      } else {
        toast.error(`İade başarısız: ${data.error || 'Bilinmeyen hata'}`);
      }
    } catch (e: any) {
      toast.error(`Hata: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (inv: InvoiceRow, newStatus: string) => {
    if (newStatus === inv.status) return;
    if (!confirm(`${inv.period} — ${inv.tenantEmail}\n\nDurumu "${invoiceStatusLabel(newStatus)}" olarak değiştirmek istediğinize emin misiniz?`)) return;
    const key = `${inv.ownerUid}:${inv.contractId}:${inv.id}`;
    setBusyId(key);
    try {
      const token = await getToken();
      const resp = await fetch(STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerUid: inv.ownerUid, contractId: inv.contractId, invoiceId: inv.id, newStatus }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success(`Durum "${invoiceStatusLabel(newStatus)}" olarak güncellendi.`);
        setItems((prev) => prev.map((x) =>
          x.id === inv.id && x.ownerUid === inv.ownerUid && x.contractId === inv.contractId
            ? { ...x, status: newStatus } : x
        ));
      } else {
        toast.error(`Güncelleme başarısız: ${data.error || 'Bilinmeyen hata'}`);
      }
    } catch (e: any) {
      toast.error(`Hata: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);

  const statusBadge = (status?: string) => {
    const cls =
      status === 'PAID' ? 'badge-success'
        : status === 'REFUNDED' ? 'badge-danger'
          : status === 'FAILED' ? 'badge-danger'
            : status === 'OVERDUE' ? 'badge-danger'
              : status === 'PAYMENT_PENDING' ? 'badge-warning'
                : 'badge-warning';
    return <span className={`badge ${cls}`}>{invoiceStatusLabel(status)}</span>;
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Faturalar</h1>
            <p className="page-subtitle">Tüm faturaları yönetin. İade ve durum değişikliği yapabilirsiniz.</p>
          </div>
          <button onClick={fetchAll} className="btn btn-secondary text-xs" disabled={loading}>
            {loading ? <span className="spinner h-3.5 w-3.5" /> : 'Yenile'}
          </button>
        </div>
        <AdminNav />

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Tümü ({items.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = items.filter((i) => i.status === s.value).length;
            if (count === 0) return null;
            return (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${filter === s.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><span className="spinner h-8 w-8" /></div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap hidden lg:block">
              <table className="min-w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">Dönem</th>
                    <th className="table-cell">Kiracı</th>
                    <th className="table-cell">Tutar</th>
                    <th className="table-cell">Durum</th>
                    <th className="table-cell">Durum Değiştir</th>
                    <th className="table-cell text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv, idx) => {
                    const key = `${inv.ownerUid}:${inv.contractId}:${inv.id}`;
                    const isBusy = busyId === key;
                    return (
                      <tr key={`${key}-${idx}`} className="hover:bg-slate-50/60">
                        <td className="table-cell">
                          <div className="font-semibold text-slate-900">{inv.period || '—'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.contractId?.slice(0, 8)}</div>
                        </td>
                        <td className="table-cell text-xs text-slate-600">{inv.tenantEmail || '—'}</td>
                        <td className="table-cell font-semibold">{inv.tenantTotal != null ? `${Number(inv.tenantTotal).toLocaleString('tr-TR')} ₺` : '—'}</td>
                        <td className="table-cell">{statusBadge(inv.status)}</td>
                        <td className="table-cell">
                          <select
                            value={inv.status || ''}
                            onChange={(e) => handleStatusChange(inv, e.target.value)}
                            disabled={isBusy}
                            className="form-input text-xs py-1 px-2 w-36"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="table-cell text-right">
                          {inv.status === 'PAID' && (
                            <button
                              onClick={() => handleRefund(inv)}
                              disabled={isBusy}
                              className="btn btn-danger text-xs px-3 py-1.5"
                            >
                              {isBusy ? <span className="spinner h-3 w-3" /> : 'İade Et'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-cell text-center text-slate-500 py-8">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filtered.map((inv, idx) => {
                const key = `${inv.ownerUid}:${inv.contractId}:${inv.id}`;
                const isBusy = busyId === key;
                return (
                  <div key={`${key}-${idx}`} className="card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{inv.period || '—'}</div>
                        <div className="text-xs text-slate-500">{inv.tenantEmail || '—'}</div>
                      </div>
                      <div className="text-right">
                        {statusBadge(inv.status)}
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {inv.tenantTotal != null ? `${Number(inv.tenantTotal).toLocaleString('tr-TR')} ₺` : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={inv.status || ''}
                        onChange={(e) => handleStatusChange(inv, e.target.value)}
                        disabled={isBusy}
                        className="form-input text-xs py-1.5 flex-1"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {inv.status === 'PAID' && (
                        <button
                          onClick={() => handleRefund(inv)}
                          disabled={isBusy}
                          className="btn btn-danger text-xs px-3 py-1.5"
                        >
                          {isBusy ? <span className="spinner h-3 w-3" /> : 'İade Et'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="card p-8 text-center text-slate-500 text-sm">Kayıt bulunamadı.</div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminPayments;
