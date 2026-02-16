import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { toast } from '../../components/Toast';

type Withdrawal = {
  id: string;
  amount: number;
  iban: string;
  status: 'PENDING' | 'SENT';
  createdAt: any;
  sentAt?: any;
  uid: string;
  displayName?: string;
};

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'admin_withdrawals'), orderBy('createdAt', 'desc')));
        setWithdrawals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        console.error('Admin withdrawals fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const markSent = async (w: Withdrawal) => {
    setSending(w.id);
    try {
      // Update admin collection
      await updateDoc(doc(db, 'admin_withdrawals', w.id), { status: 'SENT', sentAt: new Date() });
      // Update user's withdrawal
      await updateDoc(doc(db, 'accounts', w.uid, 'withdrawals', w.id), { status: 'SENT', sentAt: new Date() });
      toast.success('Para çekme talebi gönderildi olarak işaretlendi.');
      setWithdrawals((prev) => prev.map((x) => (x.id === w.id ? { ...x, status: 'SENT' } : x)));
    } catch (e: any) {
      toast.error(e?.message || 'Hata oluştu.');
    } finally {
      setSending(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <AdminGuard><div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div></AdminGuard>;

  return (
    <AdminGuard>
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Para Çekme Talepleri</h1>
        <p className="page-subtitle">Ev sahiplerinin para çekme taleplerini yönetin.</p>
      </div>
      <AdminNav />

      {withdrawals.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">Henüz para çekme talebi yok.</div>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Kullanıcı</th>
                <th className="table-cell">Tutar</th>
                <th className="table-cell">IBAN</th>
                <th className="table-cell">Tarih</th>
                <th className="table-cell">Durum</th>
                <th className="table-cell text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="table-cell font-semibold text-slate-900">{w.displayName || w.uid}</td>
                  <td className="table-cell font-bold">{Number(w.amount).toLocaleString('tr-TR')} ₺</td>
                  <td className="table-cell text-xs font-mono">{w.iban || '—'}</td>
                  <td className="table-cell text-sm">{formatDate(w.createdAt)}</td>
                  <td className="table-cell">
                    <span className={`badge ${w.status === 'SENT' ? 'badge-success' : 'badge-warning'}`}>
                      {w.status === 'SENT' ? 'Gönderildi' : 'Gönderim Bekleniyor'}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    {w.status === 'PENDING' && (
                      <button
                        onClick={() => markSent(w)}
                        disabled={sending === w.id}
                        className="btn btn-primary text-xs px-3 py-1.5"
                      >
                        {sending === w.id ? <span className="spinner h-3.5 w-3.5" /> : 'Gönderildi'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AdminGuard>
  );
};

export default AdminWithdrawals;
