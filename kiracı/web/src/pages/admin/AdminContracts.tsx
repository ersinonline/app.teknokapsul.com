import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { db } from '../../firebase';
import { collectionGroup, getDocs, limit, query, doc, deleteDoc, collection } from 'firebase/firestore';
import { contractStatusLabel } from '../../utils/status';
import { toast } from '../../components/Toast';

type AdminContractRow = {
  id: string;
  ownerUid?: string;
  landlordUid?: string;
  propertyId?: string;
  status?: string;
  rentAmount?: number;
  tenant?: { name?: string; email?: string };
  startDate?: any;
};

const AdminContracts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminContractRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collectionGroup(db, 'contracts'), limit(50));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => {
          const parts = d.ref.path.split('/');
          return { id: d.id, ownerUid: parts[1], ...(d.data() as any) };
        }));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const [deleting, setDeleting] = useState<string | null>(null);

  const formatDate = (ts: any) => (ts?.toDate ? ts.toDate().toLocaleDateString('tr-TR') : '—');

  const handleDelete = async (c: AdminContractRow) => {
    if (!c.ownerUid) { toast.error('ownerUid bulunamadı.'); return; }
    if (!window.confirm(`"${c.tenant?.name || c.id}" sözleşmesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    setDeleting(c.id);
    try {
      // Delete subcollections: invoices, requests, upfront_offers
      const subs = ['invoices', 'requests', 'upfront_offers'];
      for (const sub of subs) {
        const subSnap = await getDocs(collection(db, 'accounts', c.ownerUid, 'contracts', c.id, sub));
        for (const d of subSnap.docs) {
          await deleteDoc(d.ref);
        }
      }
      // Delete contract doc
      await deleteDoc(doc(db, 'accounts', c.ownerUid, 'contracts', c.id));
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Sözleşme silindi.');
    } catch (e: any) {
      toast.error(e?.message || 'Silme başarısız.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Sözleşmeler</h1>
          <p className="page-subtitle">Son 50 sözleşme kaydı ve durumu.</p>
        </div>
        <AdminNav />

        {loading ? (
          <div className="flex items-center justify-center py-12"><span className="spinner h-8 w-8" /></div>
        ) : (
          <div className="table-wrap">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Kiracı</th>
                  <th className="table-cell">Kira</th>
                  <th className="table-cell">Başlangıç</th>
                  <th className="table-cell">Durum</th>
                  <th className="table-cell text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="table-cell">
                      <div className="font-semibold text-slate-900">{c.tenant?.name || '—'}</div>
                      <div className="text-xs text-slate-500">{c.tenant?.email || '—'}</div>
                    </td>
                    <td className="table-cell">{c.rentAmount ?? '—'} ₺</td>
                    <td className="table-cell">{formatDate(c.startDate)}</td>
                    <td className="table-cell">{contractStatusLabel(c.status)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/contracts/${c.id}`} className="btn btn-ghost text-teal-700 text-xs px-3 py-1">
                          Detay
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deleting === c.id}
                          className="btn btn-danger text-xs px-3 py-1"
                        >
                          {deleting === c.id ? <span className="spinner h-3.5 w-3.5" /> : 'Sil'}
                        </button>
                      </div>
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
      </div>
    </AdminGuard>
  );
};

export default AdminContracts;
