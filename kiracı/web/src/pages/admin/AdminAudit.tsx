import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collectionGroup, getDocs, limit, query } from 'firebase/firestore';

type AuditRow = {
  id: string;
  actorUid?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAt?: any;
};

const AdminAudit: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AuditRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collectionGroup(db, 'audit_logs'), limit(100));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (ts: any) => (ts?.toDate ? ts.toDate().toLocaleString('tr-TR') : '—');

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Son hareket kayıtları.</p>
        </div>
        <AdminNav />

        {loading ? (
          <div className="flex items-center justify-center py-12"><span className="spinner h-8 w-8" /></div>
        ) : (
          <div className="table-wrap">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Zaman</th>
                  <th className="table-cell">Kullanıcı</th>
                  <th className="table-cell">Aksiyon</th>
                  <th className="table-cell">Varlık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="table-cell text-xs text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="table-cell text-xs text-slate-600">{item.actorUid || '—'}</td>
                    <td className="table-cell text-sm text-slate-700">{item.action || '—'}</td>
                    <td className="table-cell text-xs text-slate-600">
                      {item.entityType || '—'} {item.entityId ? `#${item.entityId}` : ''}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-slate-500">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminAudit;
