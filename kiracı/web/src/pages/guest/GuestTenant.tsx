import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { contractStatusLabel } from '../../utils/status';

type ContractDoc = {
  landlordUid: string;
  status: string;
  payDay: number;
  rentAmount: number;
  tenant: { name: string; email: string };
};

const GuestTenant: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<(ContractDoc & { id: string }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!contractId) return;
      setLoading(true);
      try {
        setError('');
        if (token) {
          const fn = httpsCallable(functions, 'guestGetContract');
          const res: any = await fn({ contractId, token });
          const data = res?.data;
          if (data?.contract) {
            setContract({ id: data.contractId, ...(data.contract as ContractDoc) });
            return;
          }
        }

        if (user?.email) {
          const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
          const snap = await getDocs(q);
          let found: (ContractDoc & { id: string }) | null = null;
          snap.forEach((d) => {
            if (d.id === contractId) found = { id: d.id, ...(d.data() as ContractDoc) };
          });
          setContract(found);
        } else {
          setContract(null);
        }
      } catch (e: any) {
        setContract(null);
        setError(e?.message || 'Sözleşme yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [contractId, user, token]);

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Misafir Sözleşme Görüntüleme</h1>
        <p className="mt-2 text-sm text-slate-600">Token ile sözleşmeyi görüntüleyebilir veya giriş yaparak erişebilirsiniz.</p>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {user || token ? (
          <>
            {contract ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <div className="text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">{contract.tenant.name}</div>
                  <div className="mt-1">Durum: {contractStatusLabel(contract.status)}</div>
                  <div className="mt-1">Kira: {contract.rentAmount} TL</div>
                  <div className="mt-1">Ödeme günü: {contract.payDay}</div>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/contracts/${contract.id}`}
                    className="btn btn-primary"
                  >
                    Uygulamada Aç
                  </Link>
                </div>
              </div>
            ) : <div className="mt-6 text-sm text-slate-700">Sözleşme bulunamadı.</div>}
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="text-sm text-slate-700">
              Token: <span className="font-mono">{token || '—'}</span>
            </div>
            <div className="text-sm text-slate-700">
              Şimdilik bu sayfayı görmek için giriş yapın:
            </div>
            <Link
              to="/login"
              className="btn btn-primary"
            >
              Giriş Yap
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestTenant;
