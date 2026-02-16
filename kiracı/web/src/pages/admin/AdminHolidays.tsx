import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminNav from '../../components/AdminNav';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from '../../components/Toast';

type HolidayRow = { id: string; createdAt?: any };

const AdminHolidays: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HolidayRow[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'accounts', user.uid, 'admin', 'holidays', 'days');
      const snap = await getDocs(ref);
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const add = async () => {
    if (!user || !date) return;
    await setDoc(doc(db, 'accounts', user.uid, 'admin', 'holidays', 'days', date), { createdAt: serverTimestamp() }, { merge: true });
    toast.success('Tatil eklendi.');
    setDate('');
    await load();
  };

  const remove = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'accounts', user.uid, 'admin', 'holidays', 'days', id));
    toast.success('Tatil silindi.');
    await load();
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Resmi Tatiller</h1>
          <p className="page-subtitle">Ödeme planlamasında kullanılacak tatil günlerini yönetin.</p>
        </div>
        <AdminNav />

        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="form-label">Tarih (YYYY-MM-DD)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>
            <button
              onClick={add}
              className="btn btn-primary"
            >
              Ekle
            </button>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8"><span className="spinner h-6 w-6" /></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items
                  .sort((a, b) => (a.id > b.id ? 1 : -1))
                  .map((h) => (
                    <div key={h.id} className="py-3 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900">{h.id}</div>
                      <button onClick={() => remove(h.id)} className="btn btn-danger text-xs px-3 py-1">
                        Sil
                      </button>
                    </div>
                  ))}
                {items.length === 0 && <div className="py-6 text-sm text-slate-500">Henüz tatil yok.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminHolidays;
