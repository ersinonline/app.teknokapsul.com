import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { payoutStatusLabel } from '../../utils/status';

type Payout = {
  id: string;
  contractId?: string;
  invoiceId?: string;
  landlordUid?: string;
  amount?: number;
  plannedAt?: any;
  transferredAt?: any;
  status?: 'PLANNED' | 'TRANSFERRED';
  referenceNo?: string;
};

const PayoutsList: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'accounts', user.uid, 'payouts'), orderBy('plannedAt', 'desc'));
        const snap = await getDocs(q);
        setPayouts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch {
        setPayouts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, [user]);

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('tr-TR');
  };

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aktarımlar</h1>
          <p className="page-subtitle">
            Ödemeler iyzico üzerinden tahsil edildikten sonra planlanan tarihte manuel olarak aktarılır.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Tutar</th>
              <th className="table-cell">Planlanan Tarih</th>
              <th className="table-cell">Durum</th>
              <th className="table-cell">Referans</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="table-cell font-semibold text-slate-900">
                  {typeof p.amount === 'number' ? `${p.amount} ₺` : '—'}
                </td>
                <td className="table-cell">{formatDate(p.plannedAt)}</td>
                <td className="table-cell">
                  <span className={p.status === 'TRANSFERRED' ? 'badge badge-success' : 'badge badge-warning'}>
                    {payoutStatusLabel(p.status || 'PLANNED')}
                  </span>
                </td>
                <td className="table-cell">{p.referenceNo || '—'}</td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={4} className="table-cell text-center text-slate-500">
                  Henüz payout kaydı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutsList;
