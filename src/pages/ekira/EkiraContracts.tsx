import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ChevronRight, Calendar, User } from 'lucide-react';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { contractStatusLabel } from './utils/status';

interface Contract {
  id: string;
  property?: { title?: string };
  tenant?: { name?: string; email?: string };
  title?: string;
  propertyName?: string;
  tenantName?: string;
  monthlyRent?: number;
  status: string;
  rentAmount?: number;
  startDate?: any;
  endDate?: any;
  createdAt?: any;
  ownerUid?: string;
  landlordId?: string;
}

const EkiraContracts: React.FC = () => {
  const { uid, activeRole, tenantContracts } = useEkira();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) loadContracts();
  }, [uid, activeRole]);

  const loadContracts = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      if (activeRole === 'landlord') {
        // Hem eski hem yeni koleksiyonlardan çek
        const [oldSnap, newSnap] = await Promise.all([
          getDocs(collection(db, 'accounts', uid, 'contracts')).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'ekira_contracts'), where('landlordId', '==', uid))).catch(() => ({ docs: [] })),
        ]);
        const oldContracts = oldSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contract));
        const newContracts = newSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contract));
        setContracts([...newContracts, ...oldContracts]);
      } else {
        setContracts(tenantContracts as Contract[]);
      }
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'EDEVLET_APPROVED': return 'bg-blue-100 text-blue-700';
      case 'DRAFT_READY': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Sözleşmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/ekira')} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white rotate-180" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Sözleşmeler</h1>
                <p className="text-white/60 text-xs">{contracts.length} sözleşme</p>
              </div>
            </div>
            {activeRole === 'landlord' && (
              <button
                onClick={() => navigate('/ekira/contracts/new')}
                className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {contracts.length === 0 ? (
          <div className="bank-card p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-3">Henüz sözleşme yok.</p>
            {activeRole === 'landlord' && (
              <button
                onClick={() => navigate('/ekira/contracts/new')}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-medium"
              >
                Yeni Sözleşme Oluştur
              </button>
            )}
          </div>
        ) : (
          contracts.map(contract => (
            <button
              key={contract.id}
              onClick={() => navigate(`/ekira/contracts/${contract.id}`)}
              className="bank-card p-4 w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {contract.propertyName || contract.property?.title || contract.title || 'Sözleşme'}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <User className="w-3 h-3" />
                    <span>{contract.tenantName || contract.tenant?.name || contract.tenant?.email || 'Kiracı belirtilmemiş'}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusStyle(contract.status)}`}>
                  {contractStatusLabel(contract.status)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {contract.rentAmount && (
                    <span className="font-medium text-foreground">{contract.rentAmount.toLocaleString('tr-TR')} ₺/ay</span>
                  )}
                  {contract.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(contract.startDate).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default EkiraContracts;
