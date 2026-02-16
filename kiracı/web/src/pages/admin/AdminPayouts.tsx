import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collectionGroup, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { payoutStatusLabel } from '../../utils/status';
import { toast } from '../../components/Toast';

type PayoutRow = {
  id: string;
  landlordUid?: string;
  agentUid?: string;
  amount?: number;
  plannedAt?: any;
  status?: string;
  referenceNo?: string;
  transferredAt?: any;
  _ref?: any;
};

const AdminPayouts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PayoutRow[]>([]);
  const [modal, setModal] = useState<{ open: boolean; payout?: PayoutRow; referenceNo: string }>({ open: false, referenceNo: '' });

  const fetchList = async (onlyPlanned = true) => {
    setLoading(true);
    try {
      const q = onlyPlanned
        ? query(collectionGroup(db, 'payouts'), where('status', '==', 'PLANNED'), limit(50))
        : query(collectionGroup(db, 'payouts'), limit(50));
      const snap = await getDocs(q);
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          _ref: d.ref,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(true);
  }, []);

  const formatDate = (ts: any) => (ts?.toDate ? ts.toDate().toLocaleDateString('tr-TR') : '—');

  const planned = useMemo(() => items.filter((p) => p.status === 'PLANNED'), [items]);

  const markTransferred = async () => {
    const payout = modal.payout;
    if (!payout?._ref) return;
    await updateDoc(payout._ref, {
      status: 'TRANSFERRED',
      referenceNo: modal.referenceNo || null,
      transferredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    toast.success('Aktarım onaylandı!');
    setModal({ open: false, referenceNo: '' });
    await fetchList(true);
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Aktarımlar</h1>
          <p className="page-subtitle">Planlanan aktarım listeleri ve manuel onaylar.</p>
        </div>
        <AdminNav />

        {modal.open && (
          <div className="modal-overlay">
            <div className="modal-content max-w-lg">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Aktarıldı İşaretle</div>
                <button onClick={() => setModal({ open: false, referenceNo: '' })} className="btn btn-secondary">
                  Kapat
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-sm text-slate-700">
                  Tutar: <span className="font-semibold">{modal.payout?.amount ?? '—'} ₺</span>
                </div>
                <div>
                  <label className="form-label">Referans No (opsiyonel)</label>
                  <input
                    value={modal.referenceNo}
                    onChange={(e) => setModal((p) => ({ ...p, referenceNo: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <button
                  onClick={markTransferred}
                  className="btn btn-primary w-full"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => fetchList(true)} className="btn btn-secondary">
            Planlananlar
          </button>
          <button onClick={() => fetchList(false)} className="btn btn-secondary">
            Tümü
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><span className="spinner h-8 w-8" /></div>
        ) : (
          <div className="table-wrap">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Tutar</th>
                  <th className="table-cell">Planlanan</th>
                  <th className="table-cell">Durum</th>
                  <th className="table-cell">Referans</th>
                  <th className="table-cell text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-900">
                      {typeof p.amount === 'number' ? `${p.amount} ₺` : '—'}
                    </td>
                    <td className="table-cell">{formatDate(p.plannedAt)}</td>
                    <td className="table-cell">{payoutStatusLabel(p.status)}</td>
                    <td className="table-cell">{p.referenceNo || '—'}</td>
                    <td className="table-cell text-right">
                      {p.status === 'PLANNED' && (
                        <button
                          onClick={() => setModal({ open: true, payout: p, referenceNo: '' })}
                          className="btn btn-primary text-xs px-3 py-1.5"
                        >
                          Aktarıldı İşaretle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-slate-500">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-sm text-slate-500">Planlanan payout sayısı: {planned.length}</div>
      </div>
    </AdminGuard>
  );
};

export default AdminPayouts;
