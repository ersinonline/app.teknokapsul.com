import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '../../components/Toast';

// Cloud Function URL from deployment
const CHECK_PAYMENT_URL = 'https://us-central1-superapp-37db4.cloudfunctions.net/checkPaymentStatus';

type WalletEntry = {
  id: string;
  amount: number;
  paidAt: any;
  releaseDate: any;
  status: 'BLOCKED' | 'AVAILABLE' | 'WITHDRAWN' | 'REFUNDED';
  contractId?: string;
  invoiceId?: string;
  tenantName?: string;
  period?: string;
};

type WithdrawRequest = {
  id: string;
  amount: number;
  status: 'PENDING' | 'SENT';
  createdAt: any;
  sentAt?: any;
  iban?: string;
};

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawIban, setWithdrawIban] = useState('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    let active = true;

    const checkStatuses = async (entries: WalletEntry[]) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        let hasChanges = false;

        await Promise.all(entries.map(async (entry) => {
          if (!entry.invoiceId || !entry.contractId) return;
          try {
            // Use our deployed function
            const res = await fetch(CHECK_PAYMENT_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ownerUid: user.uid,
                contractId: entry.contractId,
                invoiceId: entry.invoiceId
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.status === 'REFUNDED' || data.changed === true) {
                hasChanges = true;
              }
            }
          } catch (err) { console.error('Status check error', entry.invoiceId, err); }
        }));

        if (hasChanges && active) {
          console.log('Detected changes, reloading...');
          toast.success('Bakiye güncelleniyor, iade işlemi tespit edildi.');
          fetchWallet();
        }
      } catch (err) {
        console.error('Background status check error:', err);
      }
    };

    const fetchWallet = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch payouts (instead of wallet)
        console.log('Fetching payouts for user:', user.uid);
        const payoutsSnap = await getDocs(collection(db, 'accounts', user.uid, 'payouts'));
        console.log('Payouts fetched:', payoutsSnap.size);

        const now = new Date();
        const items: WalletEntry[] = payoutsSnap.docs.map((d) => {
          const data = d.data() as any;
          // Payouts collection uses plannedAt for future release date
          const paidAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const releaseDate = data.plannedAt?.toDate ? data.plannedAt.toDate() : new Date(paidAt.getTime() + 8 * 24 * 60 * 60 * 1000);

          let status: WalletEntry['status'] = 'BLOCKED';

          if (data.status === 'REFUNDED' || data.invoiceStatus === 'REFUNDED') {
            status = 'REFUNDED';
          } else if (data.status === 'TRANSFERRED') {
            status = 'WITHDRAWN';
          } else if (now >= releaseDate) {
            status = 'AVAILABLE';
          } else {
            status = 'BLOCKED';
          }

          let periodText = 'Kira Tahsilatı';
          if (data.type === 'UPFRONT') {
            periodText = 'Peşin Ödeme';
          } else if (data.invoiceId) {
            periodText = `${data.invoiceId} Dönemi`;
          }

          return {
            id: d.id,
            amount: Number(data.amount || 0),
            paidAt,
            releaseDate,
            status,
            contractId: data.contractId,
            invoiceId: data.invoiceId,
            tenantName: 'Kira Ödemesi',
            period: periodText,
          };
        });

        // Sort by paidAt descending (newest first)
        items.sort((a, b) => {
          const aTime = a.paidAt?.toDate ? a.paidAt.toDate().getTime() : a.paidAt.getTime();
          const bTime = b.paidAt?.toDate ? b.paidAt.toDate().getTime() : b.paidAt.getTime();
          return bTime - aTime;
        });
        setEntries(items);

        // Check for refunds in background
        if (active) {
          const toCheck = items.filter(i => i.status === 'BLOCKED' && i.contractId && i.invoiceId);
          if (toCheck.length > 0) {
            // Fire and forget, or await? Fire and forget is better for UI responsiveness
            checkStatuses(toCheck);
          }
        }

        // Disabled withdrawals fetch
        if (active) setWithdrawals([]);
      } catch (e: any) {
        console.error('Wallet fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [user]);

  // Calculate totals based on status
  const blockedTotal = entries.filter((e) => e.status === 'BLOCKED').reduce((s, e) => s + e.amount, 0);
  const availableTotal = entries.filter((e) => e.status === 'AVAILABLE').reduce((s, e) => s + e.amount, 0);
  const withdrawnTotal = entries.filter((e) => e.status === 'WITHDRAWN').reduce((s, e) => s + e.amount, 0);
  const refundedTotal = entries.filter((e) => e.status === 'REFUNDED').reduce((s, e) => s + e.amount, 0);

  const handleWithdraw = async () => {
    if (!user) return;
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Geçerli bir tutar girin.'); return; }
    if (amount > availableTotal) { toast.error('Kullanılabilir bakiyeniz yetersiz.'); return; }
    if (!withdrawIban.trim()) { toast.error('IBAN girin.'); return; }

    setWithdrawBusy(true);
    try {
      await addDoc(collection(db, 'accounts', user.uid, 'withdrawals'), {
        amount,
        iban: withdrawIban.trim(),
        status: 'PENDING',
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email,
      });

      await addDoc(collection(db, 'admin_withdrawals'), {
        amount,
        iban: withdrawIban.trim(),
        status: 'PENDING',
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email,
      });

      toast.success('Para çekme talebi oluşturuldu!');
      setWithdrawAmount('');
      setWithdrawIban('');
      setShowWithdrawForm(false);

      // Refresh
      // Simply reload withdrawals
      const wSnap = await getDocs(collection(db, 'accounts', user.uid, 'withdrawals'));
      setWithdrawals(wSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

    } catch (e: any) {
      toast.error(e?.message || 'Hata oluştu.');
    } finally {
      setWithdrawBusy(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cüzdanım</h1>
          <p className="page-subtitle">Kira ödemelerinden gelen bakiyenizi yönetin.</p>
        </div>
        {/* Disable manual withdraw request if auto-payout system is assumed, 
            but kept enabled as per request to see balance. Usually payouts are automatic. 
            If manual withdrawal is needed from 'AVAILABLE' balance, keep this. */}
        <button onClick={() => setShowWithdrawForm(!showWithdrawForm)} className="btn btn-primary">
          Para Çekme Talebi
        </button>
      </div>

      {/* Refund Alert */}
      {refundedTotal > 0 && (
        <div className="card border-orange-200 bg-orange-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4m0 0l4-4m-4 4h11.5a4.5 4.5 0 110 9H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-orange-800">{refundedTotal.toLocaleString('tr-TR')} ₺ iade edildi</p>
              <p className="text-xs text-orange-600">iyzico üzerinden iade yapıldı. Bu tutar bakiyenizden düşürülmüştür.</p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className={`grid grid-cols-1 gap-4 ${refundedTotal > 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <div className="card p-5 border-l-4 border-l-amber-400">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Blokeli Bakiye</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{blockedTotal.toLocaleString('tr-TR')} ₺</div>
          <p className="text-xs text-slate-500 mt-1">Ödeme sonrası 7 gün bekleme süresi</p>
        </div>
        <div className="card p-5 border-l-4 border-l-emerald-400">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Kullanılabilir Bakiye</div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{availableTotal.toLocaleString('tr-TR')} ₺</div>
          <p className="text-xs text-slate-500 mt-1">Çekilmeye hazır tutar</p>
        </div>
        <div className="card p-5 border-l-4 border-l-slate-300">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Çekilen</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{withdrawnTotal.toLocaleString('tr-TR')} ₺</div>
          <p className="text-xs text-slate-500 mt-1">Bugüne kadar çekilen tutar</p>
        </div>
        {refundedTotal > 0 && (
          <div className="card p-5 border-l-4 border-l-red-400">
            <div className="text-xs font-semibold text-red-600 uppercase tracking-wider">İade Edilen</div>
            <div className="text-2xl font-bold text-red-700 mt-2">-{refundedTotal.toLocaleString('tr-TR')} ₺</div>
            <p className="text-xs text-slate-500 mt-1">iyzico iade tutarı</p>
          </div>
        )}
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <div className="card p-5 border-teal-200 bg-teal-50/30">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Para Çekme Talebi Oluştur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Tutar (₺)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="form-input"
                placeholder="Örn: 5000"
                max={availableTotal}
              />
              <p className="text-xs text-slate-500 mt-1">Maks: {availableTotal.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input
                value={withdrawIban}
                onChange={(e) => setWithdrawIban(e.target.value)}
                className="form-input"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>
            <div className="form-group flex items-end">
              <button onClick={handleWithdraw} disabled={withdrawBusy} className="btn btn-primary w-full">
                {withdrawBusy ? <span className="flex items-center gap-2"><span className="spinner h-4 w-4" /> Gönderiliyor…</span> : 'Talep Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Entries (from Payouts) */}
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Gelen Ödemeler & Aktarımlar</h3>
          <p className="text-xs text-slate-500 mt-0.5">Kiracılardan gelen ödemeler ve aktarım durumları.</p>
        </div>
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Henüz işlem yok.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const statusConfig = {
                BLOCKED: { label: 'Blokeli', cls: 'badge-warning' },
                AVAILABLE: { label: 'Kullanılabilir', cls: 'badge-success' },
                WITHDRAWN: { label: 'Aktarıldı', cls: 'badge-muted' },
                REFUNDED: { label: 'İade Edildi', cls: 'badge-danger' },
              };
              const sc = statusConfig[entry.status] || statusConfig.BLOCKED;
              return (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {entry.tenantName} {entry.period ? `· ${entry.period}` : ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Giriş: {formatDate(entry.paidAt)}
                      {entry.status === 'BLOCKED' && (
                        <span className="text-amber-600 font-medium"> · Planlanan Aktarım: {formatDate(entry.releaseDate)}</span>
                      )}
                      {entry.status === 'AVAILABLE' && (
                        <span className="text-emerald-600 font-medium"> · Çekilebilir</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-900">{entry.amount.toLocaleString('tr-TR')} ₺</span>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Requests */}
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Para Çekme Talepleri</h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Henüz para çekme talebi yok.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{Number(w.amount).toLocaleString('tr-TR')} ₺</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDateTime(w.createdAt)}
                    {w.iban && <span> · {w.iban}</span>}
                  </div>
                </div>
                <span className={`badge ${w.status === 'SENT' ? 'badge-success' : 'badge-warning'}`}>
                  {w.status === 'SENT' ? 'Gönderildi' : 'Gönderim Bekleniyor'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
