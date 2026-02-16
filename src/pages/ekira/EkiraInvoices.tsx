import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { invoiceStatusLabel } from './utils/status';

interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: any;
  month?: number;
  year?: number;
  ownerUid?: string;
}

const EkiraInvoices: React.FC = () => {
  const { uid, activeRole, tenantContracts } = useEkira();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) loadInvoices();
  }, [uid, activeRole]);

  const loadInvoices = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const allInvoices: Invoice[] = [];

      if (activeRole === 'landlord') {
        const contractsSnap = await getDocs(collection(db, 'accounts', uid, 'contracts'));
        for (const c of contractsSnap.docs) {
          const invSnap = await getDocs(collection(db, 'accounts', uid, 'contracts', c.id, 'invoices'));
          invSnap.docs.forEach(d => {
            allInvoices.push({ id: d.id, contractId: c.id, ownerUid: uid, ...d.data() } as Invoice);
          });
        }
      } else {
        for (const tc of tenantContracts) {
          const ownerUid = tc.ownerUid as string;
          if (!ownerUid) continue;
          try {
            const invSnap = await getDocs(collection(db, 'accounts', ownerUid, 'contracts', tc.id, 'invoices'));
            invSnap.docs.forEach(d => {
              allInvoices.push({ id: d.id, contractId: tc.id, ownerUid, ...d.data() } as Invoice);
            });
          } catch { /* skip */ }
        }
      }

      allInvoices.sort((a, b) => {
        const getTime = (d: any) => {
          if (!d) return 0;
          if (d.seconds) return d.seconds * 1000;
          if (d.toDate) return d.toDate().getTime();
          if (typeof d === 'string') return new Date(d).getTime();
          return new Date(d).getTime();
        };
        return getTime(b.dueDate) - getTime(a.dueDate);
      });

      setInvoices(allInvoices);
    } catch (error) {
      console.error('Faturalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'DUE': return 'bg-yellow-100 text-yellow-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'PAYMENT_PENDING': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const totalDue = invoices.filter(i => i.status === 'DUE' || i.status === 'OVERDUE').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Faturalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/ekira')} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white rotate-180" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {activeRole === 'landlord' ? 'Tahsilatlar' : 'Borçlarım'}
              </h1>
              <p className="text-white/60 text-xs">{invoices.length} fatura</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{totalDue.toLocaleString('tr-TR')} ₺</p>
              <p className="text-white/50 text-[10px]">Bekleyen</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{totalPaid.toLocaleString('tr-TR')} ₺</p>
              <p className="text-white/50 text-[10px]">Ödenen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {invoices.length === 0 ? (
          <div className="bank-card p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Henüz fatura yok.</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <div key={`${invoice.contractId}-${invoice.id}`} className="bank-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {invoice.amount?.toLocaleString('tr-TR')} ₺
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {invoice.month && invoice.year
                        ? `${invoice.month}/${invoice.year}`
                        : invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString('tr-TR')
                          : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusStyle(invoice.status)}`}>
                  {invoiceStatusLabel(invoice.status)}
                </span>
              </div>
              {invoice.dueDate && (
                <p className="text-[10px] text-muted-foreground">
                  Son ödeme: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EkiraInvoices;
