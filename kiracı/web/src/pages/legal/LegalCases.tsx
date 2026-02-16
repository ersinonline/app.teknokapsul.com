import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type LegalCase = {
  id: string;
  contractId?: string;
  invoiceId?: string;
  status?: string;
  createdAt?: any;
  checklist?: {
    noticeSent?: boolean;
    enforcementStarted?: boolean;
    evictionFiled?: boolean;
  };
};

const LegalCases: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<LegalCase[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'accounts', user.uid, 'legal_cases'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCases(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [user]);

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hukuki Süreçler</h1>
          <p className="page-subtitle">Gecikmeye düşen sözleşmeler için otomatik açılan süreçler.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Sözleşme</th>
              <th className="table-cell">Fatura</th>
              <th className="table-cell">Durum</th>
              <th className="table-cell">Checklist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="table-cell text-xs text-slate-600">{item.contractId || '—'}</td>
                <td className="table-cell text-xs text-slate-600">{item.invoiceId || '—'}</td>
                <td className="table-cell">
                  <span className="badge badge-warning">{item.status || 'OPEN'}</span>
                </td>
                <td className="table-cell text-xs text-slate-600">
                  {item.checklist
                    ? [
                        item.checklist.noticeSent ? 'İhtar' : 'İhtar yok',
                        item.checklist.enforcementStarted ? 'İcra' : 'İcra yok',
                        item.checklist.evictionFiled ? 'Tahliye' : 'Tahliye yok',
                      ].join(' • ')
                    : '—'}
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={4} className="table-cell text-center text-slate-500">
                  Hukuki süreç kaydı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LegalCases;
