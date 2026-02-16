import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../../firebase';
import { invoiceStatusLabel } from '../../utils/status';
import { toast } from '../../components/Toast';

interface Invoice {
  id: string;
  contractId: string;
  ownerUid: string;
  period: string; // YYYY-MM
  dueDate: any;
  tenantTotal: number;
  rentAmount?: number;
  lateFeeEnabled?: boolean;
  status: string; // DUE, OVERDUE, PAID
  isRed: boolean;
}

interface DepositPayment {
  contractId: string;
  ownerUid: string;
  depositBase: number;
  tenantTotal: number;
  status: string;
  type: string;
  contractLabel?: string;
}

/** Gecikme cezası hesapla: ilk 5 gün muaf, sonra günlük %1 */
const calcLateFee = (invoice: Invoice): { overdueDays: number; lateFee: number; totalWithFee: number } => {
  const due = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : (invoice.dueDate ? new Date(invoice.dueDate) : null);
  if (!due) return { overdueDays: 0, lateFee: 0, totalWithFee: invoice.tenantTotal };
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { overdueDays: 0, lateFee: 0, totalWithFee: invoice.tenantTotal };
  const penaltyDays = Math.max(0, diffDays - 5); // ilk 5 gün muaf
  const baseAmount = invoice.rentAmount || invoice.tenantTotal;
  const lateFee = invoice.lateFeeEnabled !== false ? Math.round(baseAmount * 0.01 * penaltyDays) : 0;
  return { overdueDays: diffDays, lateFee, totalWithFee: invoice.tenantTotal + lateFee };
};

/** Fatura gecikmiş mi? */
const isOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'PAID' || invoice.status === 'PAYMENT_PENDING') return false;
  const due = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : (invoice.dueDate ? new Date(invoice.dueDate) : null);
  if (!due) return false;
  return new Date() > due;
};

const InvoicesList: React.FC = () => {
  const { user, tenantContracts } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deposits, setDeposits] = useState<DepositPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [payingDeposit, setPayingDeposit] = useState(false);

  useEffect(() => {
    const statusOrder: Record<string, number> = { REFUNDED: 0, OVERDUE: 1, FAILED: 2, DUE: 3, PAYMENT_PENDING: 4, PAID: 5, CLOSED_UPFRONT: 6, TRANSFERRED: 7 };

    const processInvoices = (raw: Invoice[]): Invoice[] => {
      const processed = raw.map(inv => {
        if (isOverdue(inv) && inv.status === 'DUE') {
          return { ...inv, status: 'OVERDUE', isRed: true };
        }
        return inv;
      });
      // Önce period'a göre sırala (eskiden yeniye), sonra status'a göre
      processed.sort((a, b) => {
        const sa = statusOrder[a.status] ?? 9;
        const sb = statusOrder[b.status] ?? 9;
        if (sa !== sb) return sa - sb;
        return (a.period || '').localeCompare(b.period || '');
      });
      return processed;
    };

    const fetchInvoicesFromPath = async (ownerUid: string, contractId: string): Promise<Invoice[]> => {
      const invoicesRef = collection(db, 'accounts', ownerUid, 'contracts', contractId, 'invoices');
      const snap = await getDocs(invoicesRef);
      return snap.docs.map(d => ({
        id: d.id,
        ownerUid,
        contractId,
        ...d.data(),
      } as Invoice));
    };

    const fetchInvoices = async () => {
      if (!user) return;
      try {
        const allInvoices: Invoice[] = [];

        // 1) Fetch tenant invoices from known contract paths (no collectionGroup needed)
        if (tenantContracts.length > 0) {
          for (const tc of tenantContracts) {
            const ownerUid = tc.ownerUid as string;
            if (!ownerUid || ownerUid === user.uid) continue;
            const invs = await fetchInvoicesFromPath(ownerUid, tc.id);
            allInvoices.push(...invs);
          }
        }

        // 2) Fallback: try collectionGroup if no tenant contracts found
        if (allInvoices.length === 0 && user.email) {
          try {
            const tenantQ = query(collectionGroup(db, 'invoices'), where('tenantEmail', '==', user.email));
            const tenantSnap = await getDocs(tenantQ);
            tenantSnap.forEach((inv) => {
              const parts = inv.ref.path.split('/');
              if (parts.length >= 6 && parts[0] === 'accounts' && parts[2] === 'contracts') {
                const ownerUid = parts[1];
                const contractId = parts[3];
                if (ownerUid !== user.uid) {
                  const exists = allInvoices.some((x) => x.id === inv.id && x.contractId === contractId && x.ownerUid === ownerUid);
                  if (!exists) {
                    allInvoices.push({ id: inv.id, ownerUid, contractId, ...(inv.data() as any) } as Invoice);
                  }
                }
              }
            });
          } catch (e) {
            console.warn('collectionGroup fallback failed (permission):', e);
          }
        }

        setInvoices(processInvoices(allInvoices));

        // Fetch deposit payments
        const allDeposits: DepositPayment[] = [];
        for (const tc of tenantContracts) {
          const ownerUid = tc.ownerUid as string;
          if (!ownerUid) continue;
          try {
            const depSnap = await getDocs(collection(db, 'accounts', ownerUid, 'contracts', tc.id, 'standalone_payments'));
            depSnap.docs.forEach(d => {
              const data = d.data() as any;
              if (data.type === 'DEPOSIT') {
                allDeposits.push({
                  contractId: tc.id,
                  ownerUid,
                  depositBase: data.depositBase || data.tenantTotal || 0,
                  tenantTotal: data.tenantTotal || data.depositBase || 0,
                  status: data.status || 'DUE',
                  type: 'DEPOSIT',
                  contractLabel: tc.tenant?.name || tc.tenant?.email || tc.id,
                });
              }
            });
          } catch { /* ignore */ }
        }
        setDeposits(allDeposits);

        // If no invoices found, try generating them
        if (allInvoices.length === 0) {
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const generateInvoices = async (ownerUid: string, contractId: string) => {
              try {
                await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/generateInvoicesForContractHttp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ ownerUid, contractId }),
                });
              } catch (e) { console.warn('generateInvoices failed:', e); }
            };

            // Generate from tenant contracts
            for (const tc of tenantContracts) {
              const ownerUid = tc.ownerUid as string;
              if (!ownerUid || ownerUid === user.uid) continue;
              if (tc.status === 'EDEVLET_APPROVED' || tc.status === 'ACTIVE') {
                await generateInvoices(ownerUid, tc.id);
              }
            }

            // Re-fetch after generation
            const refreshed: Invoice[] = [];
            for (const tc of tenantContracts) {
              const ownerUid = tc.ownerUid as string;
              if (!ownerUid || ownerUid === user.uid) continue;
              const invs = await fetchInvoicesFromPath(ownerUid, tc.id);
              refreshed.push(...invs);
            }
            setInvoices(processInvoices(refreshed));
          }
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user, tenantContracts]);

  // Check iyzico payment status for invoices that have a checkoutToken
  // Also checks PAID invoices for refunds (iyzico panel refunds)
  const paymentCheckDone = useRef(false);
  useEffect(() => {
    if (loading || invoices.length === 0 || !user || paymentCheckDone.current) return;
    paymentCheckDone.current = true;

    const checkPendingPayments = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // All invoices with a checkoutToken: pending ones for status update, PAID ones for refund detection
      const pendingInvoices = invoices.filter(
        (inv) => (inv as any).iyzico?.checkoutToken
      );
      if (pendingInvoices.length === 0) return;

      let anyChanged = false;
      for (const inv of pendingInvoices) {
        try {
          const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/checkPaymentStatus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ownerUid: inv.ownerUid, contractId: inv.contractId, invoiceId: inv.id }),
          });
          const data = await resp.json();
          if (data?.changed && data?.status) {
            anyChanged = true;
            setInvoices((prev) =>
              prev.map((x) =>
                x.id === inv.id && x.contractId === inv.contractId && x.ownerUid === inv.ownerUid
                  ? { ...x, status: data.status }
                  : x
              )
            );
          }
        } catch (e) {
          console.warn('checkPaymentStatus error for', inv.id, e);
        }
      }
      if (anyChanged) {
        toast.success('Ödeme durumu güncellendi.');
      }
    };
    checkPendingPayments();
  }, [loading, invoices, user]);

  const startCheckout = async (invoice: Invoice) => {
    if (!user) return;
    setPaying(invoice.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error('Oturum bulunamadı.'); return; }
      const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createIyzicoCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerUid: invoice.ownerUid, contractId: invoice.contractId, invoiceId: invoice.id }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
      const url = data?.paymentPageUrl as string | undefined;
      if (!url) {
        toast.error('Ödeme sayfası oluşturulamadı.');
        return;
      }
      window.location.href = url;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Ödeme başlatılamadı.');
    } finally {
      setPaying(null);
    }
  };

  const isEarlyEligible = (invoice: Invoice) => {
    const due = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : null;
    if (!due) return false;
    const diff = due.getTime() - Date.now();
    return diff >= 7 * 24 * 60 * 60 * 1000;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DUE: 'badge badge-info',
      OVERDUE: 'badge badge-danger',
      PAID: 'badge badge-success',
      PAYMENT_PENDING: 'badge badge-warning',
      FAILED: 'badge badge-danger',
      REFUNDED: 'badge badge-danger',
      CLOSED_UPFRONT: 'badge badge-success',
      TRANSFERRED: 'badge badge-muted',
    };
    return (
      <span className={`${styles[status] || 'badge badge-muted'}`}>
        {invoiceStatusLabel(status)}
      </span>
    );
  };

  const canPay = (status: string) => status === 'DUE' || status === 'OVERDUE' || status === 'FAILED' || status === 'PAYMENT_PENDING' || status === 'REFUNDED';

  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
  const totalLateFees = overdueInvoices.reduce((sum, inv) => sum + calcLateFee(inv).lateFee, 0);
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + calcLateFee(inv).totalWithFee, 0);
  const refundedInvoices = invoices.filter(inv => inv.status === 'REFUNDED');
  const totalRefundedAmount = refundedInvoices.reduce((sum, inv) => sum + (inv.tenantTotal || 0), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ödemeler & Faturalar</h1>
          <p className="page-subtitle">Bekleyen ve geçmiş ödemeleriniz.</p>
        </div>
      </div>

      {/* Gecikme uyarı banner */}
      {overdueInvoices.length > 0 && (
        <div className="card border-red-200 bg-red-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-red-800">
                {overdueInvoices.length} adet gecikmiş ödemeniz var!
              </h3>
              <p className="text-xs text-red-600 mt-1">
                Toplam borç: <strong>{totalOverdueAmount.toLocaleString('tr-TR')} ₺</strong>
                {totalLateFees > 0 && (
                  <span> (gecikme cezası dahil: <strong>{totalLateFees.toLocaleString('tr-TR')} ₺</strong>)</span>
                )}
              </p>
              <p className="text-xs text-red-500 mt-1">
                İlk 5 gün muaf, sonrasında günlük %1 gecikme cezası uygulanır.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* İade uyarı banner */}
      {refundedInvoices.length > 0 && (
        <div className="card border-orange-200 bg-orange-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4m0 0l4-4m-4 4h11.5a4.5 4.5 0 110 9H15" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-orange-800">
                {refundedInvoices.length} adet iade edilmiş ödemeniz var
              </h3>
              <p className="text-xs text-orange-600 mt-1">
                Toplam: <strong>{totalRefundedAmount.toLocaleString('tr-TR')} ₺</strong> — iyzico üzerinden iade yapıldı, tekrar ödeme yapmanız gerekmektedir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Depozito Ödemeleri */}
      {deposits.length > 0 && (
        <div className="card">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Depozito Ödemeleri</h3>
            <p className="text-sm text-slate-500">Sözleşmelerinize ait depozito ödemeleri.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {deposits.map((dep, i) => {
              const isPaid = dep.status === 'PAID';
              const isPending = dep.status === 'PAYMENT_PENDING';
              return (
                <div key={i} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Depozito</p>
                    <p className="text-xs text-slate-500">{dep.contractLabel}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-700">{dep.tenantTotal.toLocaleString('tr-TR')} ₺</span>
                    {isPaid ? (
                      <span className="badge badge-success">Ödendi</span>
                    ) : isPending ? (
                      <span className="badge badge-warning">Ödeme Bekliyor</span>
                    ) : (
                      <button
                        disabled={payingDeposit}
                        onClick={async () => {
                          setPayingDeposit(true);
                          try {
                            const token = await auth.currentUser?.getIdToken();
                            if (!token) { toast.error('Oturum bulunamadı.'); return; }
                            const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createDepositCheckout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ ownerUid: dep.ownerUid, contractId: dep.contractId, amount: dep.depositBase }),
                            });
                            const data = await resp.json();
                            if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
                            if (data?.paymentPageUrl) window.location.href = data.paymentPageUrl;
                            else toast.error('Ödeme sayfası oluşturulamadı.');
                          } catch (e: any) {
                            toast.error(e?.message || 'Ödeme başlatılamadı.');
                          } finally {
                            setPayingDeposit(false);
                          }
                        }}
                        className="btn btn-primary text-xs px-3 py-1.5"
                      >
                        {payingDeposit ? <span className="spinner h-3.5 w-3.5" /> : 'Öde'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invoices.length === 0 && deposits.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <p className="empty-state-title">Henüz fatura bulunmuyor</p>
            <p className="empty-state-text">Aktif sözleşmeleriniz için faturalar otomatik oluşturulacaktır.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap hidden sm:block">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Dönem</th>
                  <th className="table-cell">Son Ödeme</th>
                  <th className="table-cell">Tutar</th>
                  <th className="table-cell">Durum</th>
                  <th className="table-cell text-right">Öde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={`${invoice.ownerUid}:${invoice.contractId}:${invoice.id}`} className={invoice.isRed ? 'bg-amber-50/60' : 'hover:bg-slate-50/60'}>
                    <td className="table-cell font-semibold text-slate-900">{invoice.period}</td>
                    <td className="table-cell">
                      {invoice.dueDate?.toDate ? new Date(invoice.dueDate.toDate()).toLocaleDateString('tr-TR') : 'Belirsiz'}
                    </td>
                    <td className="table-cell">
                      {(() => {
                        const { lateFee, totalWithFee } = calcLateFee(invoice);
                        if ((invoice.status === 'OVERDUE' || invoice.status === 'REFUNDED') && lateFee > 0) {
                          return (
                            <div>
                              <span className="font-bold text-red-700">{totalWithFee.toLocaleString('tr-TR')} ₺</span>
                              <div className="text-xs text-red-500">+{lateFee.toLocaleString('tr-TR')} ₺ ceza</div>
                            </div>
                          );
                        }
                        return <span>{invoice.tenantTotal.toLocaleString('tr-TR')} ₺</span>;
                      })()}
                    </td>
                    <td className="table-cell">{getStatusBadge(invoice.status)}</td>
                    <td className="table-cell text-right">
                      {canPay(invoice.status) && (
                        <button
                          onClick={() => startCheckout(invoice)}
                          disabled={paying === invoice.id}
                          className="btn btn-primary text-xs px-3 py-1.5"
                        >
                          {paying === invoice.id ? (
                            <span className="flex items-center gap-1.5"><span className="spinner h-3.5 w-3.5" /> Yönlendiriliyor…</span>
                          ) : invoice.status === 'REFUNDED' ? 'Tekrar Öde (İade)' : invoice.status === 'FAILED' ? 'Tekrar Öde' : isEarlyEligible(invoice) ? 'Erken Öde' : 'Öde'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {invoices.map((invoice) => (
              <div key={`${invoice.ownerUid}:${invoice.contractId}:${invoice.id}`} className={`card p-4 ${invoice.isRed ? 'border-amber-200 bg-amber-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">{invoice.period}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Son ödeme: {invoice.dueDate?.toDate ? new Date(invoice.dueDate.toDate()).toLocaleDateString('tr-TR') : 'Belirsiz'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {getStatusBadge(invoice.status)}
                    {(() => {
                      const { lateFee, totalWithFee } = calcLateFee(invoice);
                      if ((invoice.status === 'OVERDUE' || invoice.status === 'REFUNDED') && lateFee > 0) {
                        return (
                          <div className="text-right">
                            <span className="text-sm font-bold text-red-700">{totalWithFee.toLocaleString('tr-TR')} ₺</span>
                            <div className="text-[10px] text-red-500">+{lateFee.toLocaleString('tr-TR')} ₺ ceza</div>
                          </div>
                        );
                      }
                      return <span className="text-sm font-bold text-slate-900">{invoice.tenantTotal.toLocaleString('tr-TR')} ₺</span>;
                    })()}
                  </div>
                </div>
                {canPay(invoice.status) && (
                  <button
                    onClick={() => startCheckout(invoice)}
                    disabled={paying === invoice.id}
                    className="btn btn-primary w-full mt-3 text-xs py-2"
                  >
                    {paying === invoice.id ? (
                      <span className="flex items-center justify-center gap-1.5"><span className="spinner h-3.5 w-3.5" /> Yönlendiriliyor…</span>
                    ) : invoice.status === 'REFUNDED' ? 'Tekrar Öde (İade Edildi)' : invoice.status === 'FAILED' ? 'Tekrar Öde (Kredi Kartı)' : isEarlyEligible(invoice) ? 'Erken Öde (Komisyonsuz)' : 'Öde (Kredi Kartı)'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicesList;
