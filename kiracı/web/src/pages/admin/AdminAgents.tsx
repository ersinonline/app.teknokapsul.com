import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collectionGroup, getDocs } from 'firebase/firestore';

type AgentRow = {
  uid: string;
  displayName?: string;
  email?: string;
  agentId?: string;
  accountId: string;
};

const AdminAgents: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collectionGroup(db, 'members'));
        const list: AgentRow[] = [];
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data?.roles?.agent) {
            const parts = d.ref.path.split('/');
            list.push({
              uid: d.id,
              displayName: data.displayName || '',
              email: data.email || '',
              agentId: data.agentId || '',
              accountId: parts[1],
            });
          }
        });
        setAgents(list);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  if (loading) return <AdminGuard><div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div></AdminGuard>;

  return (
    <AdminGuard>
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Emlakçılar</h1>
        <p className="page-subtitle">Sistemde kayıtlı tüm emlakçı hesapları.</p>
      </div>
      <AdminNav />

      {agents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="empty-state-title">Henüz emlakçı yok</p>
            <p className="empty-state-text">Emlakçı rolüne sahip kullanıcılar burada görünecek.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Ad Soyad</th>
                <th className="table-cell">E-posta</th>
                <th className="table-cell">Agent ID</th>
                <th className="table-cell">UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.uid} className="hover:bg-slate-50/60">
                  <td className="table-cell font-semibold text-slate-900">{agent.displayName || '—'}</td>
                  <td className="table-cell text-sm text-slate-600">{agent.email || '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-info">{agent.agentId || '—'}</span>
                  </td>
                  <td className="table-cell text-xs text-slate-400 font-mono">{agent.uid.slice(0, 12)}…</td>
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

export default AdminAgents;
