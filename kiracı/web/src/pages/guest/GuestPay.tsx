import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { invoiceStatusLabel } from '../../utils/status';
import { toast } from '../../components/Toast';

type InvoiceDoc = {
  period: string;
  dueDate: any;
  tenantTotal: number;
  status: string;
};

const GuestPay: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<(InvoiceDoc & { id: string; contractId: string })[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!contractId) return;
      setLoading(true);
      try {
        setError('');
        if (token) {
          const fn = httpsCallable(functions, 'guestListInvoices');
          const res: any = await fn({ contractId, token });
          const list = (res?.data?.invoices || []) as any[];
          setInvoices(list.map((x) => ({ id: x.id, contractId, ...x })));
          return;
        }

        if (user?.email) {
          const contractsQ = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
          const contractsSnap = await getDocs(contractsQ);
          const matches = contractsSnap.docs.filter((d) => d.id === contractId);
          const nextInvoices: (InvoiceDoc & { id: string; contractId: string })[] = [];

          for (const c of matches) {
            const pathParts = c.ref.path.split('/');
            const accountId = pathParts[1];
            const invoicesRef = collection(db, 'accounts', accountId, 'contracts', contractId, 'invoices');
            const invSnap = await getDocs(invoicesRef);
            invSnap.forEach((inv) => {
              nextInvoices.push({ id: inv.id, contractId, ...(inv.data() as InvoiceDoc) });
            });
          }

          setInvoices(nextInvoices);
        } else {
          setInvoices([]);
        }
      } catch (e: any) {
        setInvoices([]);
        setError(e?.message || 'Faturalar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [contractId, user, token]);

  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => (a.period < b.period ? 1 : -1));
  }, [invoices]);

  const isEarlyEligible = (inv: InvoiceDoc) => {
    const due = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
    if (!due) return false;
    const diff = due.getTime() - Date.now();
    return diff >= 7 * 24 * 60 * 60 * 1000;
  };

  if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Misafir Ödeme</h1>
        <p className="mt-2 text-sm text-slate-600">Token ile giriş yapmadan ödeme başlatabilirsiniz.</p>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {user || token ? (
          <>
            {sorted.length > 0 ? (
              <div className="mt-6 space-y-3">
                {sorted.map((inv) => (
                  <div key={inv.id} className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">{inv.period}</div>
                      <div className="text-slate-600">Tutar: {inv.tenantTotal} ₺</div>
                      <div className="text-slate-600">Durum: {invoiceStatusLabel(inv.status)}</div>
                      {isEarlyEligible(inv) && (
                        <div className="mt-1 text-xs text-emerald-600">Erken ödeme komisyonsuz.</div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!token) {
                          toast.error('Token bulunamadı.');
                          return;
                        }
                        setPayingId(inv.id);
                        try {
                          const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/guestCreateIyzicoCheckout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contractId, invoiceId: inv.id, token }),
                          });
                          const data = await resp.json();
                          if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
                          const url = data?.paymentPageUrl as string | undefined;
                          if (!url) { toast.error('Ödeme sayfası oluşturulamadı.'); return; }
                          window.location.href = url;
                        } catch (e: any) {
                          toast.error(e?.message || 'Ödeme başlatılamadı.');
                        } finally {
                          setPayingId(null);
                        }
                      }}
                      disabled={payingId === inv.id}
                      className="btn btn-primary"
                    >
                      {payingId === inv.id ? (
                        <span className="flex items-center gap-1.5"><span className="spinner h-3.5 w-3.5" /> Yönlendiriliyor…</span>
                      ) : isEarlyEligible(inv) ? 'Erken Öde' : 'Öde'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-sm text-slate-700">Bu sözleşmeye ait fatura bulunamadı.</div>
            )}

            <div className="mt-6">
              <Link to={`/contracts/${contractId}`} className="text-sm font-semibold text-teal-700">
                Sözleşmeye Dön
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="text-sm text-slate-700">
              Token: <span className="font-mono">{token || '—'}</span>
            </div>
            <div className="text-sm text-slate-700">Ödeme için giriş yapın:</div>
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

export default GuestPay;
