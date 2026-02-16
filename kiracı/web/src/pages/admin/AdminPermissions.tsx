import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collectionGroup, getDocs } from 'firebase/firestore';

type PermissionRow = {
  id: string;
  ownerUid: string;
  propertyId: string;
  agentUid: string;
  agentId?: string;
  displayName?: string;
  grantedAt?: any;
};

const AdminPermissions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collectionGroup(db, 'agent_permissions'));
        const list: PermissionRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const parts = d.ref.path.split('/');
          return {
            id: d.id,
            ownerUid: parts[1],
            propertyId: parts[3],
            agentUid: data.agentUid || d.id,
            agentId: data.agentId || '',
            displayName: data.displayName || '',
            grantedAt: data.grantedAt,
          };
        });
        setPermissions(list);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('tr-TR');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Yetki Yönetimi</h1>
          <p className="page-subtitle">Ev sahiplerinin emlakçılara verdiği ev bazlı yetkiler.</p>
        </div>
      </div>

      {permissions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="empty-state-title">Henüz yetki kaydı yok</p>
            <p className="empty-state-text">Ev sahipleri emlakçılara yetki verdiğinde burada görünecek.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Emlakçı</th>
                <th className="table-cell">Agent ID</th>
                <th className="table-cell">Ev Sahibi UID</th>
                <th className="table-cell">Taşınmaz ID</th>
                <th className="table-cell">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((p) => (
                <tr key={`${p.ownerUid}-${p.propertyId}-${p.id}`} className="hover:bg-slate-50/60">
                  <td className="table-cell font-semibold text-slate-900">{p.displayName || p.agentUid.slice(0, 12)}</td>
                  <td className="table-cell"><span className="badge badge-info">{p.agentId || '—'}</span></td>
                  <td className="table-cell text-xs text-slate-400 font-mono">{p.ownerUid.slice(0, 12)}…</td>
                  <td className="table-cell text-xs text-slate-400 font-mono">{p.propertyId.slice(0, 12)}…</td>
                  <td className="table-cell text-sm text-slate-600">{formatDate(p.grantedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPermissions;
