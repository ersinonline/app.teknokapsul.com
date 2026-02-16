import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, functions } from '../../firebase';
import { toast } from '../../components/Toast';
import { collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth } from '../../firebase';

type ContractDoc = {
  landlordUid: string;
  status: string;
  payDay: number;
  rentAmount: number;
  depositAmount?: number;
  lateFeeEnabled?: boolean;
  tenant: { name: string; email: string; tckn?: string; phone?: string };
};

const Edevlet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<(ContractDoc & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const landlordRef = doc(db, 'accounts', user.uid, 'contracts', id);
        const landlordSnap = await getDoc(landlordRef);
        if (landlordSnap.exists()) {
          setContract({ id: landlordSnap.id, ...(landlordSnap.data() as ContractDoc) });
          return;
        }

        if (!user.email) return;
        const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
        const tenantSnap = await getDocs(q);
        let found: (ContractDoc & { id: string }) | null = null;
        tenantSnap.forEach((d) => {
          if (d.id === id) found = { id: d.id, ...(d.data() as ContractDoc) };
        });
        setContract(found);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id, user]);

  const isLandlord = useMemo(() => {
    if (!user || !contract) return false;
    return user.uid === contract.landlordUid;
  }, [contract, user]);

  const clauses = useMemo(() => {
    if (!contract) return [];
    return [
      `Kira bedeli her ayın ${contract.payDay}. günü ödenir.`,
      `Aylık kira bedeli ${contract.rentAmount} TL’dir.`,
      `Depozito bedeli ${contract.depositAmount || 0} TL’dir.`,
      contract.lateFeeEnabled
        ? 'Ödeme gecikirse ilk 5 gün faiz uygulanmaz; 6. günden itibaren günlük %1 faiz uygulanır.'
        : 'Ödeme gecikmelerinde faiz uygulanmaz.',
    ];
  }, [contract]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(label);
      window.setTimeout(() => setCopyOk(null), 1500);
    } catch {
      setCopyOk(null);
      toast.error('Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.');
    }
  };

  const handleSetStatus = async (newStatus: string) => {
    if (!user || !id || !contract) return;
    const ownerUid = contract.landlordUid || user.uid;
    await updateDoc(doc(db, 'accounts', ownerUid, 'contracts', id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    setContract((prev) => (prev ? { ...prev, status: newStatus } : prev));

    if (newStatus === 'EDEVLET_APPROVED') {
      const fn = httpsCallable(functions, 'generateInvoicesForContract');
      try {
        await fn({ ownerUid, contractId: id });
      } catch {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/generateInvoicesForContractHttp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ownerUid, contractId: id }),
          });
        }
      }
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;
  if (!contract) return <div className="text-sm text-slate-500">Sözleşme bulunamadı.</div>;
  if (contract.status === 'EDEVLET_APPROVED' || contract.status === 'ACTIVE') {
    return (
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900">e-Devlet</h1>
        <p className="text-sm text-slate-600">Sözleşme onaylandıktan sonra e-Devlet adımları kapanır.</p>
        <Link to={`/contracts/${contract.id}`} className="btn btn-secondary mt-4">Sözleşmeye Dön</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">e-Devlet Aktarım Modu</h1>
          <p className="page-subtitle">
            Sözleşme maddelerini tek tek veya toplu kopyalayın ve e-Devlet ekranına yapıştırın.
          </p>
        </div>
        <Link to={`/contracts/${contract.id}`} className="btn btn-secondary">
          Detaya Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Kopyalanacak Maddeler</h2>
            <button
              onClick={() => handleCopy(clauses.map((c, i) => `${i + 1}. ${c}`).join('\n'), 'Toplu')}
              className="btn btn-primary"
            >
              Toplu Kopyala
            </button>
          </div>
          {copyOk && <div className="px-6 pt-4 text-sm text-emerald-700">{copyOk} kopyalandı.</div>}
          <ul className="divide-y divide-slate-100">
            {clauses.map((c, idx) => (
              <li key={idx} className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="text-sm text-slate-700">
                  <div className="font-semibold text-slate-900 mb-1">Madde {idx + 1}</div>
                  <div>{c}</div>
                </div>
                <button
                  onClick={() => handleCopy(c, `Madde ${idx + 1}`)}
                  className="btn btn-secondary"
                >
                  Kopyala
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
            <p className="mt-1 text-sm text-slate-500">Onay olmadan ödeme açılmaz.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Aktardım</span>
              <span className={`badge ${contract.status === 'EDEVLET_TRANSFERRED' || contract.status === 'EDEVLET_PENDING' || contract.status === 'EDEVLET_APPROVED' ? 'badge-success' : 'badge-muted'}`}>
                {contract.status === 'DRAFT_READY' ? 'Bekliyor' : 'Tamam'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Onay Bekliyor</span>
              <span className={`badge ${contract.status === 'EDEVLET_PENDING' || contract.status === 'EDEVLET_APPROVED' ? 'badge-info' : 'badge-muted'}`}>
                {contract.status === 'EDEVLET_PENDING' || contract.status === 'EDEVLET_APPROVED' ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Onaylandı</span>
              <span className={`badge ${contract.status === 'EDEVLET_APPROVED' ? 'badge-success' : 'badge-muted'}`}>
                {contract.status === 'EDEVLET_APPROVED' ? 'Tamam' : 'Bekliyor'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {isLandlord && contract.status === 'DRAFT_READY' && (
              <button onClick={() => handleSetStatus('EDEVLET_TRANSFERRED')} className="btn btn-secondary w-full">
                Aktardım
              </button>
            )}
            {isLandlord && contract.status === 'EDEVLET_TRANSFERRED' && (
              <button onClick={() => handleSetStatus('EDEVLET_PENDING')} className="btn btn-secondary w-full">
                Onay Bekliyor
              </button>
            )}
            {!isLandlord && contract.status === 'EDEVLET_PENDING' && (
              <button onClick={() => handleSetStatus('EDEVLET_APPROVED')} className="btn btn-primary w-full">
                Sözleşmeyi Onayla
              </button>
            )}
            {isLandlord && contract.status === 'EDEVLET_PENDING' && (
              <button onClick={() => handleSetStatus('EDEVLET_APPROVED')} className="btn btn-primary w-full">
                Onaylandı (Tahsilatı Aç)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Edevlet;
