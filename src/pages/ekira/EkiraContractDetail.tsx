import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Home, User, Calendar, DollarSign, FileText, Plus, Loader2, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import { contractStatusLabel } from './utils/status';

interface Contract {
  id: string;
  landlordId: string;
  landlordName: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantTckn: string;
  monthlyRent: number;
  depositAmount: number;
  startDate: any;
  endDate: any;
  paymentDay: number;
  notes: string;
  status: string;
  createdAt: any;
}

interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  dueDate: any;
  paidDate?: any;
  status: string;
  month: string;
  createdAt: any;
}

const EkiraContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uid } = useEkira();
  const [contract, setContract] = useState<Contract | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'invoices'>('details');

  useEffect(() => {
    if (id) {
      loadContract();
      loadInvoices();
    }
  }, [id]);

  const loadContract = async () => {
    if (!id) return;
    try {
      const docSnap = await getDoc(doc(db, 'ekira_contracts', id));
      if (docSnap.exists()) {
        setContract({ id: docSnap.id, ...docSnap.data() } as Contract);
      }
    } catch (err) {
      console.error('Sözleşme yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    if (!id) return;
    try {
      const q = query(
        collection(db, 'ekira_invoices'),
        where('contractId', '==', id),
        orderBy('dueDate', 'desc')
      );
      const snap = await getDocs(q);
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    } catch (err) {
      console.error('Faturalar yüklenirken hata:', err);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!contract || !uid) return;
    setGeneratingInvoice(true);
    try {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.paymentDay);
      if (dueDate < now) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      await addDoc(collection(db, 'ekira_invoices'), {
        contractId: contract.id,
        landlordId: contract.landlordId,
        tenantName: contract.tenantName,
        propertyName: contract.propertyName,
        amount: contract.monthlyRent,
        dueDate: Timestamp.fromDate(dueDate),
        status: 'pending',
        month: monthStr,
        createdAt: Timestamp.now(),
      });

      await loadInvoices();
    } catch (err) {
      console.error('Fatura oluşturma hatası:', err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleTerminate = async () => {
    if (!contract || !id) return;
    if (!confirm('Sözleşmeyi sonlandırmak istediğinize emin misiniz?')) return;
    try {
      await updateDoc(doc(db, 'ekira_contracts', id), {
        status: 'terminated',
        updatedAt: Timestamp.now(),
      });
      setContract(prev => prev ? { ...prev, status: 'terminated' } : null);
    } catch (err) {
      console.error('Sözleşme sonlandırma hatası:', err);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      await updateDoc(doc(db, 'ekira_invoices', invoiceId), {
        status: 'paid',
        paidDate: Timestamp.now(),
      });
      await loadInvoices();
    } catch (err) {
      console.error('Ödeme işaretleme hatası:', err);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('tr-TR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page-container bg-background">
        <div className="page-content py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sözleşme bulunamadı.</p>
          <button onClick={() => navigate('/ekira/contracts')} className="mt-4 text-emerald-600 font-medium text-sm">
            Sözleşmelere Dön
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = contractStatusLabel(contract.status);

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-8">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/ekira/contracts')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{contract.propertyName}</h1>
              <p className="text-white/60 text-xs">{contract.tenantName}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              contract.status === 'active' ? 'bg-green-100 text-green-700' :
              contract.status === 'terminated' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {statusLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">₺{contract.monthlyRent.toLocaleString('tr-TR')}</p>
              <p className="text-white/50 text-[10px]">AYLIK KİRA</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{invoices.filter(i => i.status === 'paid').length}/{invoices.length}</p>
              <p className="text-white/50 text-[10px]">ÖDENEN / TOPLAM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="page-content -mt-4">
        <div className="bank-card p-1 mb-4 flex gap-1">
          <button onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'details' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
            Detaylar
          </button>
          <button onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'invoices' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
            Faturalar ({invoices.length})
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-3 mb-6">
            {/* Mülk */}
            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Mülk Bilgileri</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Mülk</span><span className="font-medium">{contract.propertyName}</span></div>
                {contract.propertyAddress && <div className="flex justify-between"><span className="text-muted-foreground">Adres</span><span className="font-medium text-right max-w-[60%]">{contract.propertyAddress}</span></div>}
              </div>
            </div>

            {/* Kiracı */}
            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Kiracı Bilgileri</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Ad Soyad</span><span className="font-medium">{contract.tenantName}</span></div>
                {contract.tenantEmail && <div className="flex justify-between"><span className="text-muted-foreground">E-posta</span><span className="font-medium">{contract.tenantEmail}</span></div>}
                {contract.tenantPhone && <div className="flex justify-between"><span className="text-muted-foreground">Telefon</span><span className="font-medium">{contract.tenantPhone}</span></div>}
                {contract.tenantTckn && <div className="flex justify-between"><span className="text-muted-foreground">TC Kimlik</span><span className="font-medium">{contract.tenantTckn}</span></div>}
              </div>
            </div>

            {/* Ödeme */}
            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold">Ödeme Bilgileri</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Aylık Kira</span><span className="font-medium">₺{contract.monthlyRent.toLocaleString('tr-TR')}</span></div>
                {contract.depositAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Depozito</span><span className="font-medium">₺{contract.depositAmount.toLocaleString('tr-TR')}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Ödeme Günü</span><span className="font-medium">Her ayın {contract.paymentDay}. günü</span></div>
              </div>
            </div>

            {/* Tarihler */}
            <div className="bank-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold">Sözleşme Tarihleri</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Başlangıç</span><span className="font-medium">{formatDate(contract.startDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bitiş</span><span className="font-medium">{formatDate(contract.endDate)}</span></div>
              </div>
            </div>

            {contract.notes && (
              <div className="bank-card p-4">
                <h3 className="text-sm font-semibold mb-2">Notlar</h3>
                <p className="text-sm text-muted-foreground">{contract.notes}</p>
              </div>
            )}

            {/* Actions */}
            {contract.status === 'active' && (
              <button onClick={handleTerminate}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-200">
                <Trash2 className="w-4 h-4" />
                Sözleşmeyi Sonlandır
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {/* Generate Invoice */}
            {contract.status === 'active' && (
              <button onClick={handleGenerateInvoice} disabled={generatingInvoice}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {generatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {generatingInvoice ? 'Oluşturuluyor...' : 'Yeni Fatura Oluştur'}
              </button>
            )}

            {invoices.length === 0 ? (
              <div className="bank-card p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Henüz fatura bulunmuyor.</p>
              </div>
            ) : (
              invoices.map(invoice => (
                <div key={invoice.id} className="bank-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span className="text-sm font-medium">{invoice.month}</span>
                    </div>
                    <span className="text-sm font-bold">₺{invoice.amount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Vade: {formatDate(invoice.dueDate)}</span>
                    {invoice.status === 'paid' ? (
                      <span className="text-green-600 font-medium">Ödendi - {formatDate(invoice.paidDate)}</span>
                    ) : (
                      <button onClick={() => handleMarkPaid(invoice.id)}
                        className="text-emerald-600 font-medium hover:underline">
                        Ödendi İşaretle
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EkiraContractDetail;
