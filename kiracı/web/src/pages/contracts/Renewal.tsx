import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { addDoc, collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

type RenewalOffer = {
  offeredAt?: any;
  offeredByUid?: string;
  increasePercent?: number;
  newRentAmount?: number;
  status?: 'OFFERED' | 'ACCEPTED' | 'REJECTED';
  decidedAt?: any;
  decidedByUid?: string;
};

type ContractDoc = {
  landlordUid: string;
  status: string;
  rentAmount: number;
  startDate?: any;
  tenant: { name: string; email: string };
  renewal?: RenewalOffer;
};

const Renewal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<(ContractDoc & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [percent, setPercent] = useState('25');

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

  const startDateText = useMemo(() => {
    const d = contract?.startDate?.toDate ? contract.startDate.toDate() : null;
    if (!d) return '—';
    return d.toLocaleDateString('tr-TR');
  }, [contract]);

  const computedNewRent = useMemo(() => {
    const p = Number(percent);
    if (!Number.isFinite(p) || !contract) return contract?.rentAmount ?? 0;
    const next = Math.round(contract.rentAmount * (1 + p / 100));
    return next;
  }, [contract, percent]);

  const updateRenewal = async (patch: Partial<RenewalOffer>) => {
    if (!user || !id || !contract) return;
    const ownerUid = contract.landlordUid || user.uid;
    const nextRenewal: RenewalOffer = { ...(contract.renewal || {}), ...patch };
    await updateDoc(doc(db, 'accounts', ownerUid, 'contracts', id), {
      renewal: nextRenewal,
      updatedAt: serverTimestamp(),
    });
    setContract((prev) => (prev ? { ...prev, renewal: nextRenewal } : prev));
  };

  const handleOffer = async () => {
    if (!user || !contract) return;
    const p = Number(percent);
    if (!Number.isFinite(p) || p <= 0) return;
    await updateRenewal({
      offeredAt: serverTimestamp(),
      offeredByUid: user.uid,
      increasePercent: p,
      newRentAmount: computedNewRent,
      status: 'OFFERED',
    });

    const ownerUid = contract.landlordUid || user.uid;
    await addDoc(
      collection(db, 'accounts', ownerUid, 'contracts', id!, 'requests'),
      {
        contractId: id,
        ownerUid,
        landlordUid: ownerUid,
        tenantEmail: contract.tenant?.email || null,
        fromRole: 'landlord',
        toRole: 'tenant',
        type: 'RENEWAL_OFFER',
        message: `Kira artış teklifi: %${p} → ${computedNewRent} TL`,
        status: 'PENDING',
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
  };

  const handleAccept = async () => {
    if (!user || !contract?.renewal) return;
    await updateRenewal({
      status: 'ACCEPTED',
      decidedAt: serverTimestamp(),
      decidedByUid: user.uid,
    });
  };

  const handleReject = async () => {
    if (!user || !contract?.renewal) return;
    await updateRenewal({
      status: 'REJECTED',
      decidedAt: serverTimestamp(),
      decidedByUid: user.uid,
    });
  };

  const renewalStatusLabel = (status?: string) => {
    switch (status) {
      case 'OFFERED':
        return 'Teklif Edildi';
      case 'ACCEPTED':
        return 'Kabul Edildi';
      case 'REJECTED':
        return 'Reddedildi';
      default:
        return status || '—';
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;
  if (!contract) return <div className="text-sm text-slate-500">Sözleşme bulunamadı.</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sözleşme Yenileme</h1>
          <p className="page-subtitle">
            Başlangıç: {startDateText} • Mevcut kira: <span className="font-semibold">{contract.rentAmount} TL</span>
          </p>
        </div>
        <Link to={`/contracts/${contract.id}`} className="btn btn-secondary">
          Detaya Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Teklif</h2>
          <p className="mt-1 text-sm text-slate-500">Ev sahibi artış yüzdesi girerek teklif oluşturur.</p>

          {isLandlord ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="form-label">Artış Oranı (%)</label>
                <input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  min={1}
                  className="form-input"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Yeni kira (tahmini)</span>
                  <span className="font-semibold text-slate-900">{computedNewRent} TL</span>
                </div>
              </div>

              <button onClick={handleOffer} className="btn btn-primary w-full">
                Teklifi Oluştur / Güncelle
              </button>
            </div>
          ) : (
            <div className="mt-5 text-sm text-slate-600">
              Ev sahibinin teklifini burada göreceksiniz ve kabul/ret verebileceksiniz.
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Mevcut Durum</h2>

          {contract.renewal?.status ? (
            <div className="mt-4 space-y-3">
              <div className="text-sm">
                <div className="text-slate-500">Teklif</div>
                <div className="mt-1 font-semibold text-slate-900">
                  %{contract.renewal.increasePercent} → {contract.renewal.newRentAmount} TL
                </div>
              </div>

              <div className="text-sm">
                <div className="text-slate-500">Durum</div>
                <div className="mt-1 font-semibold text-slate-900">{renewalStatusLabel(contract.renewal.status)}</div>
              </div>

              {!isLandlord && contract.renewal.status === 'OFFERED' && (
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="btn btn-primary flex-1"
                  >
                    Kabul Et
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn btn-secondary flex-1"
                  >
                    Reddet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Henüz yenileme teklifi yok.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Renewal;
