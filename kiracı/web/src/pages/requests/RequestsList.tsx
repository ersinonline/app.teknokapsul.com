import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../firebase';
import { addDoc, collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from '../../components/Toast';

type RequestRow = {
  id: string;
  contractId?: string;
  ownerUid?: string;
  landlordUid?: string;
  tenantEmail?: string;
  fromRole?: 'landlord' | 'tenant' | 'agent';
  toRole?: 'landlord' | 'tenant' | 'agent';
  type?: string;
  message?: string;
  amount?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  createdAt?: any;
  updatedAt?: any;
  // Kira artışı
  currentRent?: number;
  increasePercent?: number;
  newRent?: number;
  effectiveMonth?: number; // hangi aydan itibaren
  // Peşin ödeme
  unpaidCount?: number;
  unpaidTotal?: number;
  discountPercent?: number;
  discountedTotal?: number;
  // Arıza
  images?: string[];
  repairCost?: number;
  messages?: Array<{ from: string; text: string; at: any }>;
};

type ContractOption = {
  id: string;
  ownerUid: string;
  landlordUid: string;
  tenantEmail: string;
  rentAmount: number;
  label: string;
  unpaidInvoices: number;
  unpaidTotal: number;
  contractDuration?: number;
};

const statusLabel = (s?: string) => {
  switch (s) {
    case 'PENDING': return 'Bekliyor';
    case 'APPROVED': return 'Onaylandı';
    case 'REJECTED': return 'Reddedildi';
    case 'CLOSED': return 'Kapandı';
    default: return s || '—';
  }
};

const formatDate = (ts: any) => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const typeLabel = (type?: string) => {
  switch (type) {
    case 'RENT_INCREASE': return 'Kira Artışı Talebi';
    case 'UPFRONT_OFFER': return 'Peşin Ödeme Teklifi';
    case 'REPAIR_REQUEST': return 'Arıza Bildirimi';
    case 'CANCEL_REQUEST': return 'Sözleşme İptal Talebi';
    default: return type || 'Genel Talep';
  }
};

const typeIcon: Record<string, string> = {
  RENT_INCREASE: '📈',
  UPFRONT_OFFER: '💰',
  REPAIR_REQUEST: '🔧',
  CANCEL_REQUEST: '❌',
};

const TENANT_TYPES = [
  { value: 'RENT_INCREASE', label: 'Kira Artışı Talebi' },
  { value: 'UPFRONT_OFFER', label: 'Peşin Ödeme Teklifi' },
  { value: 'REPAIR_REQUEST', label: 'Arıza Bildirimi' },
  { value: 'CANCEL_REQUEST', label: 'Sözleşme İptali' },
];

const LANDLORD_TYPES = [
  { value: 'RENT_INCREASE', label: 'Kira Artışı Talebi' },
  { value: 'CANCEL_REQUEST', label: 'Sözleşme İptali' },
];

const RequestsList: React.FC = () => {
  const { user, activeRole, tenantContracts } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [memberData, setMemberData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [requestType, setRequestType] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);

  // Kira artışı form
  const [increasePercent, setIncreasePercent] = useState('');
  const [effectiveMonth, setEffectiveMonth] = useState('');

  // Peşin ödeme form
  const [discountPercent, setDiscountPercent] = useState('');

  // Arıza form
  const [repairImages, setRepairImages] = useState<string[]>([]);
  const [repairCost, setRepairCost] = useState('');

  // Chat message for repair
  const [chatMessage, setChatMessage] = useState('');

  const selectedContractData = useMemo(() => {
    if (!selectedContract) return null;
    const [ownerUid, contractId] = selectedContract.split(':');
    return contracts.find(c => c.ownerUid === ownerUid && c.id === contractId) || null;
  }, [selectedContract, contracts]);

  const currentRent = selectedContractData?.rentAmount || 0;
  const computedNewRent = currentRent && increasePercent ? Math.round(currentRent * (1 + Number(increasePercent) / 100)) : currentRent;

  const unpaidCount = selectedContractData?.unpaidInvoices || 0;
  const unpaidTotal = selectedContractData?.unpaidTotal || 0;
  const discountedTotal = unpaidTotal && discountPercent ? Math.round(unpaidTotal * (1 - Number(discountPercent) / 100)) : unpaidTotal;

  useEffect(() => {
    const fetchMember = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'accounts', user.uid, 'members', user.uid));
      setMemberData(snap.exists() ? snap.data() : null);
    };
    fetchMember();
  }, [user]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;
      const list: ContractOption[] = [];

      // Landlord contracts
      const ownSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
      for (const d of ownSnap.docs) {
        const data = d.data() as any;
        if (data.status === 'ACTIVE' || data.status === 'EDEVLET_APPROVED') {
          // Count unpaid invoices
          const invSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts', d.id, 'invoices'));
          const unpaid = invSnap.docs.filter(i => {
            const s = i.data().status;
            return s === 'DUE' || s === 'OVERDUE' || s === 'REFUNDED' || s === 'FAILED';
          });
          const unpaidSum = unpaid.reduce((sum, i) => sum + (i.data().tenantTotal || 0), 0);

          list.push({
            id: d.id,
            ownerUid: user.uid,
            landlordUid: user.uid,
            tenantEmail: data.tenant?.email || '',
            rentAmount: Number(data.rentAmount || 0),
            label: `${data.tenant?.name || data.tenant?.email || d.id}`,
            unpaidInvoices: unpaid.length,
            unpaidTotal: unpaidSum,
            contractDuration: data.durationMonths || 12,
          });
        }
      }

      // Tenant contracts
      for (const tc of tenantContracts) {
        const ownerUid = tc.ownerUid as string;
        if (!ownerUid) continue;
        if (list.some(c => c.id === tc.id && c.ownerUid === ownerUid)) continue;

        let unpaidLen = 0;
        let unpaidSum = 0;
        try {
          const invSnap = await getDocs(collection(db, 'accounts', ownerUid, 'contracts', tc.id, 'invoices'));
          const unpaid = invSnap.docs.filter(i => {
            const s = i.data().status;
            return s === 'DUE' || s === 'OVERDUE' || s === 'REFUNDED' || s === 'FAILED';
          });
          unpaidLen = unpaid.length;
          unpaidSum = unpaid.reduce((sum, i) => sum + (i.data().tenantTotal || 0), 0);
        } catch { /* ignore */ }

        list.push({
          id: tc.id,
          ownerUid,
          landlordUid: tc.landlordUid || ownerUid,
          tenantEmail: tc.tenant?.email || user.email || '',
          rentAmount: Number(tc.rentAmount || 0),
          label: `${tc.tenant?.name || tc.tenant?.email || tc.id}`,
          unpaidInvoices: unpaidLen,
          unpaidTotal: unpaidSum,
          contractDuration: tc.durationMonths || 12,
        });
      }

      setContracts(list);
      if (list.length > 0) setSelectedContract(`${list[0].ownerUid}:${list[0].id}`);
    };
    fetchContracts();
  }, [user, tenantContracts]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const snap = await getDocs(query(collectionGroup(db, 'requests')));
        const items: RequestRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any), _ref: d.ref } as any));
        const now = Date.now();
        const filtered = items.filter(item => {
          const isOwner = item.ownerUid === user.uid || item.landlordUid === user.uid;
          const isTenant = user.email && item.tenantEmail && item.tenantEmail.toLowerCase() === user.email.toLowerCase();
          if (!isOwner && !isTenant) return false;
          if (activeRole === 'tenant') return item.fromRole === 'tenant' || item.toRole === 'tenant';
          return item.fromRole === 'landlord' || item.toRole === 'landlord';
        });

        // Auto-close PENDING requests older than 1 week (except REPAIR_REQUEST which has its own logic)
        for (const req of filtered) {
          if (req.status !== 'PENDING') continue;
          if (req.type === 'REPAIR_REQUEST') continue;
          const lastAct = req.updatedAt?.toDate ? req.updatedAt.toDate() : (req.createdAt?.toDate ? req.createdAt.toDate() : null);
          if (lastAct && (now - lastAct.getTime()) > ONE_WEEK_MS) {
            try {
              if ((req as any)._ref) {
                await updateDoc((req as any)._ref, { status: 'CLOSED', updatedAt: new Date() });
                req.status = 'CLOSED';
              }
            } catch { /* ignore */ }
          }
        }

        // Auto-close REPAIR_REQUEST if no interaction for 1 week
        for (const req of filtered) {
          if (req.type !== 'REPAIR_REQUEST' || req.status !== 'PENDING') continue;
          const msgs = (req as any).messages as any[] | undefined;
          const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
          const lastTime = lastMsg?.at?.toDate ? lastMsg.at.toDate() : (req.updatedAt?.toDate ? req.updatedAt.toDate() : (req.createdAt?.toDate ? req.createdAt.toDate() : null));
          if (lastTime && (now - lastTime.getTime()) > ONE_WEEK_MS) {
            try {
              if ((req as any)._ref) {
                await updateDoc((req as any)._ref, { status: 'CLOSED', updatedAt: new Date() });
                req.status = 'CLOSED';
              }
            } catch { /* ignore */ }
          }
        }

        filtered.sort((a, b) => {
          const order: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2, CLOSED: 3 };
          return (order[a.status || ''] ?? 9) - (order[b.status || ''] ?? 9);
        });

        setRequests(filtered);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user, activeRole]);

  const resetForm = () => {
    setRequestMessage('');
    setIncreasePercent('');
    setEffectiveMonth('');
    setDiscountPercent('');
    setRepairImages([]);
    setRepairCost('');
    setRequestType('');
    setShowForm(false);
  };

  const handleCreateRequest = async () => {
    if (!user || !selectedContract || !requestType) return;
    const [ownerUid, contractId] = selectedContract.split(':');
    const contract = contracts.find(c => c.ownerUid === ownerUid && c.id === contractId);
    if (!contract) { toast.error('Sözleşme bulunamadı.'); return; }

    const fromRole = activeRole === 'tenant' ? 'tenant' : 'landlord';
    const toRole = fromRole === 'landlord' ? 'tenant' : 'landlord';

    setRequestBusy(true);
    try {
      const requestData: any = {
        contractId,
        ownerUid,
        landlordUid: contract.landlordUid,
        tenantEmail: contract.tenantEmail,
        fromRole,
        toRole,
        type: requestType,
        message: requestMessage,
        status: 'PENDING',
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Kira artışı
      if (requestType === 'RENT_INCREASE') {
        if (!increasePercent || Number(increasePercent) <= 0) { toast.error('Artış oranı girin.'); setRequestBusy(false); return; }
        if (!effectiveMonth || Number(effectiveMonth) < 1) { toast.error('Geçerli bir ay girin.'); setRequestBusy(false); return; }
        requestData.currentRent = currentRent;
        requestData.increasePercent = Number(increasePercent);
        requestData.newRent = computedNewRent;
        requestData.effectiveMonth = Number(effectiveMonth);
      }

      // Peşin ödeme
      if (requestType === 'UPFRONT_OFFER') {
        const dp = Number(discountPercent || 0);
        if (dp < 0 || dp > 10) { toast.error('İndirim oranı 0-10 arasında olmalı.'); setRequestBusy(false); return; }
        requestData.unpaidCount = unpaidCount;
        requestData.unpaidTotal = unpaidTotal;
        requestData.discountPercent = dp;
        requestData.discountedTotal = discountedTotal;
      }

      // Sözleşme iptali
      if (requestType === 'CANCEL_REQUEST') {
        if (!requestMessage.trim()) { toast.error('Açıklama yazın.'); setRequestBusy(false); return; }
      }

      // Arıza bildirimi
      if (requestType === 'REPAIR_REQUEST') {
        if (!requestMessage.trim()) { toast.error('Arıza açıklaması yazın.'); setRequestBusy(false); return; }
        requestData.images = repairImages;
        requestData.repairCost = Number(repairCost || 0);
        requestData.messages = [];
      }

      const ref = collection(db, 'accounts', ownerUid, 'contracts', contractId, 'requests');
      await addDoc(ref, requestData);
      toast.success('Talep gönderildi!');
      resetForm();

      // Refresh
      const snap2 = await getDocs(query(collectionGroup(db, 'requests')));
      const items: RequestRow[] = snap2.docs.map(d => ({ id: d.id, ...(d.data() as any), _ref: d.ref } as any));
      const filtered = items.filter(item => {
        const isOwner = item.ownerUid === user.uid || item.landlordUid === user.uid;
        const isTenant = user.email && item.tenantEmail && item.tenantEmail.toLowerCase() === user.email.toLowerCase();
        if (!isOwner && !isTenant) return false;
        if (activeRole === 'tenant') return item.fromRole === 'tenant' || item.toRole === 'tenant';
        return item.fromRole === 'landlord' || item.toRole === 'landlord';
      });
      filtered.sort((a, b) => {
        const order: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2, CLOSED: 3 };
        return (order[a.status || ''] ?? 9) - (order[b.status || ''] ?? 9);
      });
      setRequests(filtered);
    } catch (e) {
      console.error(e);
      toast.error('Talep gönderilemedi.');
    } finally {
      setRequestBusy(false);
    }
  };

  const myRoles = useMemo(() => ({
    landlord: Boolean(memberData?.roles?.landlord),
    tenant: Boolean(memberData?.roles?.tenant),
  }), [memberData]);

  const canActOn = (req: RequestRow) => {
    if (req.status !== 'PENDING') return false;
    if (req.toRole === 'landlord' && (myRoles.landlord || req.ownerUid === user?.uid || req.landlordUid === user?.uid)) return true;
    if (req.toRole === 'tenant' && (myRoles.tenant || (user?.email && req.tenantEmail && req.tenantEmail.toLowerCase() === user.email.toLowerCase()))) return true;
    return false;
  };

  const updateStatus = async (req: any, status: 'APPROVED' | 'REJECTED') => {
    if (!req?._ref) return;
    const updateData: any = { status, updatedAt: new Date(), decidedByUid: user?.uid || null };

    // ── Kira artışı onaylandığında ──
    // Mevcut sözleşmede effectiveMonth'a kadar olan faturalar kalır (eski kira).
    // effectiveMonth'tan sonraki ödenmemiş faturaları sil.
    // Eski sözleşme bitiş tarihinde başlayan yeni 12 aylık sözleşme oluştur (yeni kira).
    if (req.type === 'RENT_INCREASE' && status === 'APPROVED' && req.ownerUid && req.contractId) {
      try {
        const contractRef = doc(db, 'accounts', req.ownerUid, 'contracts', req.contractId);
        const contractSnap = await getDoc(contractRef);
        const contractData = contractSnap.data() as any;

        const newRent = req.newRent || req.currentRent;
        const effectiveMonth = req.effectiveMonth || 1;
        const startDate = contractData?.startDate?.toDate ? contractData.startDate.toDate() : new Date();
        const durationMonths = contractData?.durationMonths || 12;

        // Eski sözleşme bitiş tarihi
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // effectiveMonth'tan sonraki ödenmemiş faturaları sil
        const invSnap = await getDocs(collection(db, 'accounts', req.ownerUid, 'contracts', req.contractId, 'invoices'));
        for (const invDoc of invSnap.docs) {
          const invData = invDoc.data() as any;
          const period = invData.period || '';
          // period format: YYYY-MM, startDate'den kaç ay sonra?
          const periodDate = new Date(period + '-01');
          const monthDiff = (periodDate.getFullYear() - startDate.getFullYear()) * 12 + (periodDate.getMonth() - startDate.getMonth());
          // effectiveMonth'tan sonraki ve ödenmemiş olanları sil
          if (monthDiff >= effectiveMonth && invData.status !== 'PAID' && invData.status !== 'CLOSED_UPFRONT') {
            try {
              await updateDoc(doc(db, 'accounts', req.ownerUid, 'contracts', req.contractId, 'invoices', invDoc.id), {
                status: 'TRANSFERRED',
                closedReason: 'RENT_INCREASE_NEW_CONTRACT',
                updatedAt: new Date(),
              });
            } catch { /* ignore */ }
          }
        }

        // Mevcut sözleşmeyi güncelle — bitiş tarihini effectiveMonth'a ayarla
        await updateDoc(contractRef, {
          'renewal.approvedAt': new Date(),
          'renewal.newRent': newRent,
          'renewal.effectiveMonth': effectiveMonth,
          updatedAt: new Date(),
        });

        // Yeni sözleşme oluştur — eski sözleşme bitiş tarihinde başlasın, 12 ay
        const newContractRef = doc(collection(db, 'accounts', req.ownerUid, 'contracts'));
        await setDoc(newContractRef, {
          ...contractData,
          rentAmount: newRent,
          startDate: endDate,
          durationMonths: 12,
          status: contractData.status,
          previousContractId: req.contractId,
          createdAt: new Date(),
          updatedAt: new Date(),
          depositPaid: contractData.depositPaid || false,
          depositAmount: contractData.depositAmount || 0,
        });

        toast.success(`Yeni sözleşme oluşturuldu. Kira: ${newRent.toLocaleString('tr-TR')} ₺`);
      } catch (e) { console.error('Rent increase update error:', e); }
    }

    // ── Sözleşme iptali onaylandığında otomatik iptal ──
    if (req.type === 'CANCEL_REQUEST' && status === 'APPROVED' && req.ownerUid && req.contractId) {
      try {
        const contractRef = doc(db, 'accounts', req.ownerUid, 'contracts', req.contractId);
        await updateDoc(contractRef, {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUid: user?.uid || null,
          cancelReason: req.message || 'Karşılıklı anlaşma ile iptal',
          updatedAt: new Date(),
        });
        toast.success('Sözleşme iptal edildi.');
      } catch (e) { console.error('Cancel contract error:', e); }
    }

    // ── Peşin ödeme onaylandığında ──
    if (req.type === 'UPFRONT_OFFER' && status === 'APPROVED' && req.ownerUid && req.contractId) {
      updateData.paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      try {
        // upfront_offers koleksiyonuna kayıt oluştur (createUpfrontCheckout bunu bekliyor)
        const offersCol = collection(db, 'accounts', req.ownerUid, 'contracts', req.contractId, 'upfront_offers');
        const offerDoc = await addDoc(offersCol, {
          status: 'ACCEPTED',
          months: req.unpaidCount || 0,
          offerAmount: req.discountedTotal || req.unpaidTotal || 0,
          discountPercent: req.discountPercent || 0,
          unpaidTotal: req.unpaidTotal || 0,
          requestId: req.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        updateData.offerId = offerDoc.id;

        // iyzico checkout linki oluştur
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createUpfrontCheckout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              ownerUid: req.ownerUid,
              contractId: req.contractId,
              offerId: offerDoc.id,
            }),
          });
          const data = await resp.json();
          if (resp.ok && data?.paymentPageUrl) {
            updateData.paymentUrl = data.paymentPageUrl;
          } else {
            console.error('Upfront checkout response:', data);
          }
        }
      } catch (e) { console.error('Upfront checkout error:', e); }
    }

    // ── Arıza talebi onaylandığında ilk ödenmemiş faturadan düş ──
    if (req.type === 'REPAIR_REQUEST' && status === 'APPROVED' && req.ownerUid && req.contractId && req.repairCost > 0) {
      try {
        const invSnap = await getDocs(collection(db, 'accounts', req.ownerUid, 'contracts', req.contractId, 'invoices'));
        // Ödenmemiş faturaları period'a göre sırala (en eski önce)
        const unpaidInvoices = invSnap.docs
          .filter(d => {
            const s = d.data().status;
            return s === 'DUE' || s === 'OVERDUE' || s === 'REFUNDED' || s === 'FAILED';
          })
          .sort((a, b) => (a.data().period || '').localeCompare(b.data().period || ''));

        if (unpaidInvoices.length > 0) {
          const firstUnpaid = unpaidInvoices[0];
          const invData = firstUnpaid.data() as any;
          const currentTotal = invData.tenantTotal || 0;
          const newTotal = Math.max(0, currentTotal - req.repairCost);
          const invRef = doc(db, 'accounts', req.ownerUid, 'contracts', req.contractId, 'invoices', firstUnpaid.id);
          await updateDoc(invRef, {
            tenantTotal: newTotal,
            repairDeduction: req.repairCost,
            repairRequestId: req.id,
            updatedAt: new Date(),
          });
          toast.success(`${req.repairCost.toLocaleString('tr-TR')} ₺ arıza ücreti ${invData.period} faturasından düşüldü.`);
        } else {
          toast.error('Ödenmemiş fatura bulunamadı, arıza ücreti düşülemedi.');
        }
      } catch (e) { console.error('Repair cost deduction error:', e); }
    }

    await updateDoc(req._ref, updateData);
    toast.success(status === 'APPROVED' ? 'Talep onaylandı.' : 'Talep reddedildi.');
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status, ...(updateData.paymentUrl ? { paymentUrl: updateData.paymentUrl } : {}) } : r));
  };

  // Arıza mesajı gönder
  const sendRepairMessage = async (req: any) => {
    if (!chatMessage.trim() || !req?._ref) return;
    const msgs = req.messages || [];
    msgs.push({
      from: activeRole === 'tenant' ? 'Kiracı' : 'Ev Sahibi',
      text: chatMessage.trim(),
      at: new Date(),
    });
    await updateDoc(req._ref, { messages: msgs, updatedAt: new Date() });
    setChatMessage('');
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, messages: msgs } : r));
    toast.success('Mesaj gönderildi.');
  };

  // Arıza ücreti güncelle (sadece ev sahibi)
  const updateRepairCost = async (req: any, cost: number) => {
    if (!req?._ref) return;
    await updateDoc(req._ref, { repairCost: cost, updatedAt: new Date() });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, repairCost: cost } : r));
    toast.success('Arıza ücreti güncellendi.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setRepairImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const closedCount = requests.filter(r => r.status === 'CLOSED' || r.status === 'REJECTED').length;

  const requestTypes = activeRole === 'tenant' ? TENANT_TYPES : LANDLORD_TYPES;

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  const statusBadge = (status?: string) => {
    const cls = status === 'APPROVED' ? 'badge-success' : status === 'REJECTED' ? 'badge-danger' : status === 'CLOSED' ? 'badge-muted' : 'badge-warning';
    return <span className={`badge ${cls}`}>{statusLabel(status)}</span>;
  };

  const roleLabel = (role?: string) => role === 'landlord' ? 'Ev Sahibi' : role === 'tenant' ? 'Kiracı' : role || '—';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Talepler</h1>
          <p className="page-subtitle">
            {pendingCount > 0
              ? <><strong className="text-amber-600">{pendingCount}</strong> bekleyen talep var.</>
              : 'Talep oluşturun veya mevcut talepleri yönetin.'}
          </p>
        </div>
        {contracts.length > 0 && (
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            {showForm ? 'İptal' : '+ Talep Oluştur'}
          </button>
        )}
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <div className="text-xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-slate-500">Bekleyen</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xl font-bold text-emerald-600">{approvedCount}</div>
            <div className="text-xs text-slate-500">Onaylanan</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xl font-bold text-slate-400">{closedCount}</div>
            <div className="text-xs text-slate-500">Kapanan</div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Yeni Talep Oluştur</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sözleşme</label>
              <select value={selectedContract} onChange={e => setSelectedContract(e.target.value)} className="form-input">
                {contracts.map(c => (
                  <option key={`${c.ownerUid}:${c.id}`} value={`${c.ownerUid}:${c.id}`}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Talep Türü</label>
              <select value={requestType} onChange={e => setRequestType(e.target.value)} className="form-input">
                <option value="">Seçiniz...</option>
                {requestTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Kira Artışı Formu ── */}
          {requestType === 'RENT_INCREASE' && (
            <div className="space-y-4 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800">Kira Artışı Detayları</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Güncel Kira</label>
                  <div className="form-input bg-slate-100 text-slate-700 cursor-not-allowed">{currentRent.toLocaleString('tr-TR')} ₺</div>
                </div>
                <div>
                  <label className="form-label">Artış Oranı (%)</label>
                  <input type="number" value={increasePercent} onChange={e => setIncreasePercent(e.target.value)} className="form-input" placeholder="Ör: 25" min="1" max="100" />
                </div>
                <div>
                  <label className="form-label">Yeni Kira</label>
                  <div className="form-input bg-emerald-50 text-emerald-700 font-bold cursor-not-allowed">
                    {computedNewRent.toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">Kaçıncı aydan itibaren geçerli?</label>
                <input type="number" value={effectiveMonth} onChange={e => setEffectiveMonth(e.target.value)} className="form-input" placeholder="Ör: 7 (7. aydan itibaren)" min="1" max="24" />
                <p className="text-xs text-slate-500 mt-1">Sözleşme sonunda mı yoksa daha erken bir tarihte mi? Örn: 7 yazarsanız 7. aydan itibaren artış uygulanır ve sözleşme 12 ay olarak yenilenir.</p>
              </div>
              <div>
                <label className="form-label">Açıklama</label>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="form-input" rows={2} placeholder="Artış sebebi veya ek bilgi..." />
              </div>
            </div>
          )}

          {/* ── Peşin Ödeme Teklifi Formu ── */}
          {requestType === 'UPFRONT_OFFER' && (
            <div className="space-y-4 bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <h4 className="text-sm font-semibold text-amber-800">Peşin Ödeme Teklifi</h4>
              {unpaidCount === 0 ? (
                <p className="text-sm text-amber-700">Ödenmemiş fatura bulunmuyor.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Ödenmemiş Fatura</label>
                      <div className="form-input bg-slate-100 text-slate-700 cursor-not-allowed">{unpaidCount} adet</div>
                    </div>
                    <div>
                      <label className="form-label">Toplam Borç</label>
                      <div className="form-input bg-slate-100 text-slate-700 cursor-not-allowed">{unpaidTotal.toLocaleString('tr-TR')} ₺</div>
                    </div>
                    <div>
                      <label className="form-label">İndirim Oranı (% maks. 10)</label>
                      <input type="number" value={discountPercent} onChange={e => {
                        const v = Number(e.target.value);
                        if (v > 10) { toast.error('Maksimum %10 indirim talep edebilirsiniz.'); return; }
                        setDiscountPercent(e.target.value);
                      }} className="form-input" placeholder="Ör: 8" min="0" max="10" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <span className="text-xs text-amber-600">İndirimli Toplam:</span>
                    <span className="text-lg font-bold text-amber-800 ml-2">{discountedTotal.toLocaleString('tr-TR')} ₺</span>
                    {Number(discountPercent) > 0 && (
                      <span className="text-xs text-emerald-600 ml-2">(%{discountPercent} indirim)</span>
                    )}
                  </div>
                  <p className="text-xs text-amber-600">Ev sahibi onaylarsa 1 hafta içinde ödeme yapmanız gerekir. Ödeme yapılırsa tüm ödenmemiş borçlar silinir.</p>
                  <div>
                    <label className="form-label">Açıklama</label>
                    <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="form-input" rows={2} placeholder="Ek bilgi..." />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Sözleşme İptali Formu ── */}
          {requestType === 'CANCEL_REQUEST' && (
            <div className="space-y-4 bg-red-50/50 rounded-xl p-4 border border-red-100">
              <h4 className="text-sm font-semibold text-red-800">Sözleşme İptali</h4>
              <p className="text-xs text-red-600">Karşı taraf onaylarsa sözleşme iptal edilecektir.</p>
              <div>
                <label className="form-label">İptal Sebebi / Açıklama *</label>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="form-input" rows={3} placeholder="İptal sebebinizi detaylı yazın..." />
              </div>
            </div>
          )}

          {/* ── Arıza Bildirimi Formu ── */}
          {requestType === 'REPAIR_REQUEST' && (
            <div className="space-y-4 bg-orange-50/50 rounded-xl p-4 border border-orange-100">
              <h4 className="text-sm font-semibold text-orange-800">Arıza Bildirimi</h4>
              <div>
                <label className="form-label">Arıza Açıklaması *</label>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="form-input" rows={3} placeholder="Arızayı detaylı açıklayın..." />
              </div>
              <div>
                <label className="form-label">Fotoğraf Ekle</label>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="form-input text-sm" />
                {repairImages.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {repairImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                        <button onClick={() => setRepairImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Tahmini Arıza Ücreti (₺)</label>
                <input type="number" value={repairCost} onChange={e => setRepairCost(e.target.value)} className="form-input" placeholder="0" min="0" />
                <p className="text-xs text-orange-600 mt-1">Ev sahibi bu tutarı sonradan değiştirebilir. Onaylanırsa ilk ödenmemiş kiradan düşülür.</p>
              </div>
            </div>
          )}

          {requestType && (
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="btn btn-secondary">İptal</button>
              <button
                onClick={handleCreateRequest}
                disabled={requestBusy || !requestType}
                className="btn btn-primary"
              >
                {requestBusy ? <span className="flex items-center gap-1.5"><span className="spinner h-3.5 w-3.5" /> Gönderiliyor…</span> : 'Gönder'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="empty-state-title">Henüz talep yok</p>
            <p className="empty-state-text">Sözleşmelerinize ait talepler burada görünecek.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const isExpanded = expandedId === req.id;
            const isClosed = req.status === 'CLOSED' || req.status === 'REJECTED';
            return (
              <div key={req.id} className={`card overflow-hidden ${isClosed ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <span className="text-xl shrink-0">{typeIcon[req.type] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{typeLabel(req.type)}</span>
                      {statusBadge(req.status)}
                    </div>
                    {!isExpanded && req.message && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{req.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(req.createdAt)}</span>
                    <svg className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/30 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Gönderen</span>
                        <span className="font-semibold text-slate-700">{roleLabel(req.fromRole)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Alıcı</span>
                        <span className="font-semibold text-slate-700">{roleLabel(req.toRole)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Oluşturulma</span>
                        <span className="font-semibold text-slate-700">{formatDate(req.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Son Güncelleme</span>
                        <span className="font-semibold text-slate-700">{formatDate(req.updatedAt)}</span>
                      </div>
                    </div>

                    {req.message && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <span className="text-xs text-slate-400 block mb-1">Açıklama</span>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.message}</p>
                      </div>
                    )}

                    {/* Kira Artışı Detayları */}
                    {req.type === 'RENT_INCREASE' && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-blue-400 block">Güncel Kira</span>
                            <span className="font-bold text-blue-700">{(req.currentRent || 0).toLocaleString('tr-TR')} ₺</span>
                          </div>
                          <div>
                            <span className="text-blue-400 block">Artış Oranı</span>
                            <span className="font-bold text-blue-700">%{req.increasePercent || 0}</span>
                          </div>
                          <div>
                            <span className="text-blue-400 block">Yeni Kira</span>
                            <span className="font-bold text-emerald-700">{(req.newRent || 0).toLocaleString('tr-TR')} ₺</span>
                          </div>
                          <div>
                            <span className="text-blue-400 block">Geçerlilik</span>
                            <span className="font-bold text-blue-700">{req.effectiveMonth}. aydan itibaren</span>
                          </div>
                        </div>
                        {req.status === 'APPROVED' && (
                          <p className="text-xs text-emerald-600">Onaylandı. Sözleşme {req.effectiveMonth}. aydan itibaren {(req.newRent || 0).toLocaleString('tr-TR')} ₺ olarak güncellenecek ve 12 ay olarak yenilenecek.</p>
                        )}
                      </div>
                    )}

                    {/* Peşin Ödeme Detayları */}
                    {req.type === 'UPFRONT_OFFER' && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-amber-400 block">Ödenmemiş Fatura</span>
                            <span className="font-bold text-amber-700">{req.unpaidCount} adet</span>
                          </div>
                          <div>
                            <span className="text-amber-400 block">Toplam Borç</span>
                            <span className="font-bold text-amber-700">{(req.unpaidTotal || 0).toLocaleString('tr-TR')} ₺</span>
                          </div>
                          <div>
                            <span className="text-amber-400 block">İndirim</span>
                            <span className="font-bold text-amber-700">%{req.discountPercent || 0}</span>
                          </div>
                          <div>
                            <span className="text-amber-400 block">Ödenecek</span>
                            <span className="font-bold text-emerald-700">{(req.discountedTotal || 0).toLocaleString('tr-TR')} ₺</span>
                          </div>
                        </div>
                        {req.status === 'APPROVED' && (
                          <div className="space-y-2">
                            <p className="text-xs text-emerald-600">Onaylandı. 1 hafta içinde ödeme yapılmalıdır.</p>
                            {req.paymentUrl && (
                              <a
                                href={req.paymentUrl}
                                className="btn btn-primary text-xs inline-block"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Peşin Ödeme Yap ({(req.discountedTotal || req.unpaidTotal || 0).toLocaleString('tr-TR')} ₺)
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Arıza Bildirimi Detayları */}
                    {req.type === 'REPAIR_REQUEST' && (
                      <div className="space-y-3">
                        {/* Görseller */}
                        {req.images && req.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {req.images.map((img: string, i: number) => (
                              <img key={i} src={img} alt="" className="h-20 w-20 object-cover rounded-lg border" />
                            ))}
                          </div>
                        )}

                        {/* Arıza ücreti */}
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-orange-400 block">Arıza Ücreti</span>
                              <span className="font-bold text-orange-700">{(req.repairCost || 0).toLocaleString('tr-TR')} ₺</span>
                            </div>
                            {activeRole === 'landlord' && req.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  defaultValue={req.repairCost || 0}
                                  className="form-input w-24 text-sm"
                                  min="0"
                                  onBlur={e => {
                                    const v = Number(e.target.value);
                                    if (v !== req.repairCost) updateRepairCost(req, v);
                                  }}
                                />
                                <span className="text-xs text-slate-500">₺</span>
                              </div>
                            )}
                          </div>
                          {req.repairCost > 0 && req.status === 'APPROVED' && (
                            <p className="text-xs text-orange-600 mt-1">Bu tutar ilk ödenmemiş kiradan düşülecektir.</p>
                          )}
                        </div>

                        {/* Mesajlaşma */}
                        {req.status === 'PENDING' && (
                          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                            <span className="text-xs font-semibold text-slate-600">Mesajlar</span>
                            {(req.messages || []).length === 0 && (
                              <p className="text-xs text-slate-400">Henüz mesaj yok.</p>
                            )}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {(req.messages || []).map((msg: any, i: number) => (
                                <div key={i} className={`text-xs p-2 rounded-lg ${msg.from === 'Kiracı' ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'}`}>
                                  <span className="font-semibold">{msg.from}:</span> {msg.text}
                                  <span className="text-[10px] text-slate-400 ml-2">{msg.at?.toDate ? formatDate(msg.at) : (msg.at ? new Date(msg.at).toLocaleString('tr-TR') : '')}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendRepairMessage(req)}
                                className="form-input flex-1 text-sm"
                                placeholder="Mesaj yazın..."
                              />
                              <button onClick={() => sendRepairMessage(req)} className="btn btn-primary text-xs px-3">Gönder</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Closed notice */}
                    {isClosed && (
                      <div className="text-xs text-slate-400 bg-slate-100 rounded-lg p-3">
                        {req.status === 'REJECTED' ? 'Bu talep reddedildi.' : 'Bu talep 1 hafta boyunca etkileşim olmadığı için otomatik kapatıldı.'}
                      </div>
                    )}

                    {/* Action buttons */}
                    {canActOn(req) && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => updateStatus(req, 'APPROVED')} className="btn btn-primary text-xs px-4 py-2">
                          Onayla
                        </button>
                        <button onClick={() => updateStatus(req, 'REJECTED')} className="btn btn-danger text-xs px-4 py-2">
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsList;
