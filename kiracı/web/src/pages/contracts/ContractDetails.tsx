import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, functions } from '../../firebase';
import { toast } from '../../components/Toast';
import { collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { contractStatusLabel } from '../../utils/status';
import { httpsCallable } from 'firebase/functions';
import { auth } from '../../firebase';

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [acceptedOffer, setAcceptedOffer] = useState<any>(null);
  const [upfrontPaying, setUpfrontPaying] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchContract = async () => {
      if (!user || !id) return;
      try {
        let ownerUid: string | null = null;
        const docRef = doc(db, 'accounts', user.uid, 'contracts', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setContract({ id: docSnap.id, ...docSnap.data() });
          ownerUid = user.uid;
        } else {
          if (!user.email) { setLoading(false); return; }
          const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((d) => {
            if (d.id === id) {
              setContract({ id: d.id, ...d.data() });
              const parts = d.ref.path.split('/');
              ownerUid = parts[1];
            }
          });
        }

        // Fetch invoices
        if (ownerUid) {
          setInvoicesLoading(true);
          try {
            const invoicesRef = collection(db, 'accounts', ownerUid, 'contracts', id, 'invoices');
            const invoicesSnap = await getDocs(invoicesRef);
            const invList = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            invList.sort((a: any, b: any) => (a.period || '').localeCompare(b.period || ''));
            setInvoices(invList);
          } catch (e) {
            console.error('Error fetching invoices:', e);
          } finally {
            setInvoicesLoading(false);
          }

          // Count pending requests
          try {
            const reqRef = collection(db, 'accounts', ownerUid, 'contracts', id, 'requests');
            const reqSnap = await getDocs(reqRef);
            const pending = reqSnap.docs.filter(d => d.data().status === 'PENDING').length;
            setPendingRequests(pending);
          } catch { /* ignore */ }
        }

        // Fetch accepted upfront offer
        if (ownerUid) {
          const offersRef = collection(db, 'accounts', ownerUid, 'contracts', id, 'upfront_offers');
          const offersSnap = await getDocs(offersRef);
          const accepted = offersSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .find((o: any) => o.status === 'ACCEPTED');
          if (accepted) {
            const expiresAt = accepted.expiresAt?.toDate ? accepted.expiresAt.toDate() : (accepted.expiresAt ? new Date(accepted.expiresAt) : null);
            const payDeadline = accepted.acceptedAt?.toDate
              ? new Date(accepted.acceptedAt.toDate().getTime() + 7 * 24 * 60 * 60 * 1000)
              : expiresAt ? new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
            if (payDeadline && payDeadline.getTime() > Date.now()) {
              setAcceptedOffer({ ...accepted, ownerUid, payDeadline });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [user, id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user || !id || !contract) return;
    try {
      const ownerUid = contract.landlordUid || user.uid;
      const docRef = doc(db, 'accounts', ownerUid, 'contracts', id);
      await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
      setContract((prev: any) => ({ ...prev, status: newStatus }));

      if (newStatus === 'EDEVLET_APPROVED') {
        const fn = httpsCallable(functions, 'generateInvoicesForContract');
        try {
          await fn({ ownerUid, contractId: id });
        } catch {
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/generateInvoicesForContractHttp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ownerUid, contractId: id }),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Durum güncellenemedi.');
    }
  };

  const generateGuestLink = async () => {
    if (!user || !id || !contract) return;
    const ownerUid = contract.landlordUid || user.uid;
    if (user.uid !== ownerUid) return;
    setGuestBusy(true);
    try {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = btoa(String.fromCharCode(...Array.from(bytes)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      await updateDoc(doc(db, 'accounts', ownerUid, 'contracts', id), { guest: { tokenHash: hash }, updatedAt: serverTimestamp() });
      setGuestToken(token);
      setContract((prev: any) => ({ ...prev, guest: { ...(prev?.guest || {}), tokenHash: hash } }));
    } finally {
      setGuestBusy(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('tr-TR');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;
  if (!contract) return (
    <div className="card">
      <div className="empty-state">
        <p className="empty-state-title">Sözleşme bulunamadı</p>
        <p className="empty-state-text">Bu sözleşmeye erişim yetkiniz olmayabilir.</p>
        <Link to="/contracts" className="btn btn-primary mt-4">Sözleşmelere Dön</Link>
      </div>
    </div>
  );

  const isLandlord = user?.uid === contract.landlordUid;
  const startDate = contract.startDate?.toDate ? contract.startDate.toDate() : null;
  const endDate = contract.endDate?.toDate ? contract.endDate.toDate() : null;
  const depositAmount = Number(contract.depositAmount || 0);
  const depositPaid = contract.deposit?.status === 'PAID';
  const depositDueDate = startDate;

  const statusBadgeMap: Record<string, { cls: string; label: string }> = {
    DUE: { cls: 'badge badge-info', label: 'Bekliyor' },
    OVERDUE: { cls: 'badge badge-danger', label: 'Gecikmiş' },
    PAID: { cls: 'badge badge-success', label: 'Ödendi' },
    PAYMENT_PENDING: { cls: 'badge badge-warning', label: 'İşlemde' },
    CLOSED_UPFRONT: { cls: 'badge badge-muted', label: 'Peşin Kapandı' },
    REFUNDED: { cls: 'badge badge-danger', label: 'İade Edildi' },
    FAILED: { cls: 'badge badge-danger', label: 'Başarısız' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="page-title">{contract.tenant.name}</h2>
            <span className={contract.status === 'ACTIVE' || contract.status === 'EDEVLET_APPROVED' ? 'badge badge-success' : 'badge badge-muted'}>
              {contractStatusLabel(contract.status)}
            </span>
          </div>
          <p className="page-subtitle">
            {contract.rentAmount?.toLocaleString('tr-TR')} ₺/ay
            {startDate && <> · Başlangıç: {formatDate(contract.startDate)}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isLandlord && contract.status === 'DRAFT_READY' && (
            <>
              <Link to={`/contracts/${id}/edit`} className="btn btn-secondary">Düzenle</Link>
              <Link to={`/contracts/${contract.id}/edevlet`} className="btn btn-secondary">e-Devlet</Link>
              <button onClick={() => handleUpdateStatus('EDEVLET_TRANSFERRED')} className="btn btn-primary">e-Devlet'e Aktarıldı</button>
            </>
          )}
          {isLandlord && contract.status === 'EDEVLET_TRANSFERRED' && (
            <button onClick={() => handleUpdateStatus('EDEVLET_PENDING')} className="btn btn-secondary">Onay Bekliyor</button>
          )}
          {isLandlord && contract.status === 'EDEVLET_PENDING' && (
            <button onClick={() => handleUpdateStatus('EDEVLET_APPROVED')} className="btn btn-primary">Onaylandı (Aktif Et)</button>
          )}
          {!isLandlord && contract.status === 'EDEVLET_PENDING' && (
            <button onClick={() => handleUpdateStatus('EDEVLET_APPROVED')} className="btn btn-primary">Sözleşmeyi Onayla</button>
          )}
          {(contract.status === 'ACTIVE' || contract.status === 'EDEVLET_APPROVED') && (
            <Link to={`/contracts/${contract.id}/renewal`} className="btn btn-secondary">Yenileme</Link>
          )}
          {isLandlord && (
            <button onClick={generateGuestLink} disabled={guestBusy} className="btn btn-secondary">Misafir Linki</button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-slate-900">{contract.rentAmount?.toLocaleString('tr-TR')} ₺</div>
          <div className="text-xs text-slate-500 mt-1">Aylık Kira</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-slate-900">{contract.payDay || '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Ödeme Günü</div>
        </div>
        <div className="stat-card text-center">
          <div className={`text-2xl font-bold ${depositPaid ? 'text-emerald-600' : depositAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {depositAmount > 0 ? `${depositAmount.toLocaleString('tr-TR')} ₺` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Depozito {depositPaid ? '(Ödendi)' : ''}</div>
        </div>
        <div className="stat-card text-center">
          <div className={`text-2xl font-bold ${pendingRequests > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {pendingRequests}
          </div>
          <div className="text-xs text-slate-500 mt-1">Bekleyen Talep</div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="card">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Sözleşme Bilgileri</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: 'Kiracı', value: `${contract.tenant.name} (${contract.tenant.email || '—'})` },
            { label: 'TCKN', value: contract.tenant.tckn || '—' },
            { label: 'Telefon', value: contract.tenant.phone || '—' },
            { label: 'Aylık Kira', value: `${contract.rentAmount?.toLocaleString('tr-TR')} ₺` },
            { label: 'Ödeme Günü', value: `Her ayın ${contract.payDay}. günü` },
            { label: 'Başlangıç', value: formatDate(contract.startDate) },
            { label: 'Bitiş', value: endDate ? formatDate(contract.endDate) : '—' },
            { label: 'Depozito', value: depositAmount > 0 ? `${depositAmount.toLocaleString('tr-TR')} ₺` : 'Yok' },
            { label: 'Gecikme Faizi', value: contract.lateFeeEnabled ? 'Aktif (İlk 5 gün muaf, sonra %1/gün)' : 'Pasif' },
          ].map((item) => (
            <div key={item.label} className="grid gap-1 px-6 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-semibold text-slate-500">{item.label}</dt>
              <dd className="text-sm text-slate-900">{item.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit Payment Section */}
      {depositAmount > 0 && !depositPaid && (contract.status === 'ACTIVE' || contract.status === 'EDEVLET_APPROVED' || contract.status === 'DRAFT_READY') && (
        <div className="card border-amber-200 bg-amber-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-amber-900">Depozito Ödemesi Bekleniyor</h3>
              <p className="text-sm text-amber-700 mt-1">
                <strong>{depositAmount.toLocaleString('tr-TR')} ₺</strong> depozito tutarı
                {depositDueDate && <> · Son ödeme: <strong>{formatDate(contract.startDate)}</strong></>}
              </p>
              {!isLandlord && (
                <button
                  onClick={async () => {
                    try {
                      const token = await auth.currentUser?.getIdToken();
                      if (!token) { toast.error('Oturum bulunamadı.'); return; }
                      const ownerUid = contract.landlordUid || user?.uid;
                      const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createDepositCheckout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ ownerUid, contractId: id, amount: depositAmount }),
                      });
                      const data = await resp.json();
                      if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
                      if (data?.paymentPageUrl) window.location.href = data.paymentPageUrl;
                      else toast.error('Ödeme sayfası oluşturulamadı.');
                    } catch (e: any) {
                      toast.error(e?.message || 'Ödeme başlatılamadı.');
                    }
                  }}
                  className="btn btn-primary mt-3"
                >
                  Depozitoyu Öde ({depositAmount.toLocaleString('tr-TR')} ₺)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices / Payment Status */}
      <div className="card">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Ödeme Durumları</h3>
            <p className="text-sm text-slate-500">{isLandlord ? 'Kiracının aylık ödeme durumları.' : 'Aylık ödeme durumlarınız.'}</p>
          </div>
          {!isLandlord && (
            <Link to="/invoices" className="btn btn-secondary text-xs">Tüm Faturalar</Link>
          )}
        </div>
        {invoicesLoading ? (
          <div className="flex items-center justify-center py-8"><span className="spinner h-6 w-6" /></div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">Henüz fatura oluşturulmamış.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dönem</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Son Ödeme</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv: any) => {
                    const due = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
                    const isOverdue = due && new Date() > due && inv.status !== 'PAID' && inv.status !== 'PAYMENT_PENDING';
                    const displayStatus = isOverdue && inv.status === 'DUE' ? 'OVERDUE' : inv.status;
                    const badge = statusBadgeMap[displayStatus] || { cls: 'badge badge-muted', label: displayStatus };
                    return (
                      <tr key={inv.id} className={isOverdue ? 'bg-red-50/40' : ''}>
                        <td className="px-6 py-3 text-sm font-semibold text-slate-900">{inv.period}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{due ? due.toLocaleDateString('tr-TR') : '—'}</td>
                        <td className="px-6 py-3 text-sm text-slate-900">{Number(inv.tenantTotal || 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="px-6 py-3"><span className={badge.cls}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {invoices.map((inv: any) => {
                const due = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
                const isOverdue = due && new Date() > due && inv.status !== 'PAID' && inv.status !== 'PAYMENT_PENDING';
                const displayStatus = isOverdue && inv.status === 'DUE' ? 'OVERDUE' : inv.status;
                const badge = statusBadgeMap[displayStatus] || { cls: 'badge badge-muted', label: displayStatus };
                return (
                  <div key={inv.id} className={`px-6 py-3 flex items-center justify-between ${isOverdue ? 'bg-red-50/40' : ''}`}>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{inv.period}</div>
                      <div className="text-xs text-slate-500">{due ? due.toLocaleDateString('tr-TR') : '—'} · {Number(inv.tenantTotal || 0).toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <span className={badge.cls}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Requests — Link to Requests Page */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Talepler</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {pendingRequests > 0
                ? <><strong className="text-amber-600">{pendingRequests}</strong> bekleyen talep var.</>
                : 'Bu sözleşmeye ait talepler.'}
            </p>
          </div>
          <Link to="/requests" className="btn btn-primary">
            {pendingRequests > 0 ? `Talepleri Gör (${pendingRequests})` : 'Taleplerim'}
          </Link>
        </div>
      </div>

      {/* Guest Links */}
      {guestToken && (
        <div className="card">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Misafir Linkleri</h3>
            <p className="text-sm text-slate-500">Bu linkleri kiracıyla paylaşın.</p>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm">
            <div className="flex flex-col gap-1">
              <div className="text-slate-500">Sözleşme</div>
              <div className="font-mono break-all text-slate-800 bg-slate-50 rounded-lg p-2">{`${window.location.origin}/tenant/${contract.id}?token=${guestToken}`}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-slate-500">Ödeme</div>
              <div className="font-mono break-all text-slate-800 bg-slate-50 rounded-lg p-2">{`${window.location.origin}/pay/${contract.id}?token=${guestToken}`}</div>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Upfront Offer — Pay Button */}
      {acceptedOffer && !isLandlord && (
        <div className="card border-emerald-200 bg-emerald-50/60 p-6">
          <h3 className="text-lg font-semibold text-emerald-900">Peşin Ödeme Teklifi Onaylandı</h3>
          <p className="text-sm text-emerald-700 mt-1">
            Teklifiniz kabul edildi. <strong>{Math.ceil((acceptedOffer.payDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} gün</strong> içinde ödemeniz gerekmektedir.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-emerald-600">Teklif Tutarı</div>
              <div className="text-lg font-bold text-emerald-900">{Number(acceptedOffer.offerAmount).toLocaleString()} ₺</div>
            </div>
            <div>
              <div className="text-emerald-600">Son Ödeme</div>
              <div className="text-lg font-bold text-emerald-900">{acceptedOffer.payDeadline.toLocaleDateString('tr-TR')}</div>
            </div>
          </div>
          <button
            disabled={upfrontPaying}
            onClick={async () => {
              setUpfrontPaying(true);
              try {
                const token = await auth.currentUser?.getIdToken();
                if (!token) { toast.error('Oturum bulunamadı.'); return; }
                const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createUpfrontCheckout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ ownerUid: acceptedOffer.ownerUid, contractId: id, offerId: acceptedOffer.id }),
                });
                const data = await resp.json();
                if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
                if (data?.paymentPageUrl) window.location.href = data.paymentPageUrl;
                else toast.error('Ödeme sayfası oluşturulamadı.');
              } catch (e: any) {
                toast.error(e?.message || 'Ödeme başlatılamadı.');
              } finally {
                setUpfrontPaying(false);
              }
            }}
            className="btn btn-primary mt-4 w-full"
          >
            {upfrontPaying ? (
              <span className="flex items-center justify-center gap-2"><span className="spinner h-4 w-4" /> Yönlendiriliyor…</span>
            ) : `${Number(acceptedOffer.offerAmount).toLocaleString()} ₺ Öde`}
          </button>
        </div>
      )}

      {/* Demirbaş Listesi */}
      {contract.fixtures && contract.fixtures.length > 0 && (
        <div className="card">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Demirbaş Listesi</h3>
            <p className="text-sm text-slate-500">{contract.fixtures.length} adet demirbaş kayıtlı.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Demirbaş</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contract.fixtures.map((f: any, i: number) => (
                  <tr key={i}>
                    <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{f.name}</td>
                    <td className="px-6 py-3"><span className="badge badge-muted text-xs capitalize">{f.condition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sözleşme Maddeleri */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900">Sözleşme Maddeleri</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li className="flex gap-3"><span className="badge badge-info shrink-0">1</span>Kira bedeli her ayın {contract.payDay}. günü ödenir.</li>
          <li className="flex gap-3"><span className="badge badge-info shrink-0">2</span>Aylık kira bedeli {contract.rentAmount?.toLocaleString('tr-TR')} TL&apos;dir.</li>
          {depositAmount > 0 && (
            <li className="flex gap-3"><span className="badge badge-info shrink-0">3</span>Depozito bedeli {depositAmount.toLocaleString('tr-TR')} TL&apos;dir.</li>
          )}
          <li className="flex gap-3">
            <span className="badge badge-info shrink-0">{depositAmount > 0 ? '4' : '3'}</span>
            {contract.lateFeeEnabled ? 'Ödeme gecikirse ilk 5 gün faiz uygulanmaz; 6. günden itibaren günlük %1 faiz uygulanır.' : 'Ödeme gecikmelerinde faiz uygulanmaz.'}
          </li>
          {contract.clauses && contract.clauses.length > 0 && contract.clauses.map((clause: string, i: number) => {
            const num = (depositAmount > 0 ? 5 : 4) + i;
            return (
              <li key={i} className="flex gap-3">
                <span className="badge badge-info shrink-0">{num}</span>
                {clause}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ContractDetails;
