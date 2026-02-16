import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, CreditCard, Building2, ChevronRight, AlertCircle } from 'lucide-react';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { contractStatusLabel } from './utils/status';

const EkiraDashboard: React.FC = () => {
  const { uid, displayName, activeRole, switchRole, tenantContracts } = useEkira();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ properties: 0, contracts: 0, pendingPayments: 0, totalRevenue: 0 });
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) loadDashboard();
  }, [uid, activeRole]);

  const loadDashboard = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      if (activeRole === 'landlord') {
        // Ev sahibi: kendi mülkleri ve sözleşmeleri
        const propsSnap = await getDocs(collection(db, 'accounts', uid, 'properties'));
        const contractsSnap = await getDocs(collection(db, 'accounts', uid, 'contracts'));
        const contracts = contractsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        let pendingPayments = 0;
        let totalRevenue = 0;
        for (const c of contracts) {
          try {
            const invoicesSnap = await getDocs(
              query(collection(db, 'accounts', uid, 'contracts', c.id, 'invoices'), where('status', '==', 'DUE'))
            );
            pendingPayments += invoicesSnap.size;
            const paidSnap = await getDocs(
              query(collection(db, 'accounts', uid, 'contracts', c.id, 'invoices'), where('status', '==', 'PAID'))
            );
            paidSnap.docs.forEach(d => { totalRevenue += d.data().amount || 0; });
          } catch { /* skip */ }
        }

        setStats({
          properties: propsSnap.size,
          contracts: contracts.length,
          pendingPayments,
          totalRevenue
        });
        setRecentContracts(contracts.slice(0, 5));
      } else {
        // Kiracı
        setStats({
          properties: 0,
          contracts: tenantContracts.length,
          pendingPayments: 0,
          totalRevenue: 0
        });
        setRecentContracts(tenantContracts.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">eKira yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">eKira</h1>
                <p className="text-white/60 text-xs">
                  {displayName ? `Hoş geldin, ${displayName}` : 'Kira Yönetim Sistemi'}
                </p>
              </div>
            </div>
          </div>

          {/* Role Switch */}
          <div className="bg-white/10 rounded-xl p-1 flex gap-1 mb-4">
            <button
              onClick={() => switchRole('landlord')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeRole === 'landlord' ? 'bg-white text-green-800' : 'text-white/70'
              }`}
            >
              Ev Sahibi
            </button>
            <button
              onClick={() => switchRole('tenant')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeRole === 'tenant' ? 'bg-white text-green-800' : 'text-white/70'
              }`}
            >
              Kiracı
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {activeRole === 'landlord' ? (
              <>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">{stats.properties}</p>
                  <p className="text-white/50 text-[10px]">Taşınmaz</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">{stats.contracts}</p>
                  <p className="text-white/50 text-[10px]">Sözleşme</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">{stats.contracts}</p>
                  <p className="text-white/50 text-[10px]">Sözleşmem</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">{stats.pendingPayments}</p>
                  <p className="text-white/50 text-[10px]">Bekleyen Ödeme</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
        {/* Quick Actions */}
        <div className="bank-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-2">
            {activeRole === 'landlord' ? (
              <>
                <button
                  onClick={() => navigate('/ekira/properties')}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Taşınmazlar</span>
                </button>
                <button
                  onClick={() => navigate('/ekira/contracts')}
                  className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Sözleşmeler</span>
                </button>
                <button
                  onClick={() => navigate('/ekira/invoices')}
                  className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Tahsilatlar</span>
                </button>
                <button
                  onClick={() => navigate('/ekira/contracts/new')}
                  className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800">Yeni Sözleşme</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/ekira/invoices')}
                  className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Borçlarım</span>
                </button>
                <button
                  onClick={() => navigate('/ekira/contracts')}
                  className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Sözleşmelerim</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bank-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Son Sözleşmeler</h3>
            <button onClick={() => navigate('/ekira/contracts')} className="text-xs text-primary font-medium flex items-center gap-1">
              Tümü <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentContracts.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Henüz sözleşme yok</p>
              {activeRole === 'landlord' && (
                <button
                  onClick={() => navigate('/ekira/contracts/new')}
                  className="mt-2 text-xs text-primary font-medium"
                >
                  İlk sözleşmenizi oluşturun
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentContracts.map((contract: any) => (
                <button
                  key={contract.id}
                  onClick={() => navigate(`/ekira/contracts/${contract.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {contract.property?.title || contract.title || 'Sözleşme'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {contract.tenant?.name || contract.tenant?.email || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      contract.status === 'EDEVLET_APPROVED' ? 'bg-blue-100 text-blue-700' :
                      contract.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {contractStatusLabel(contract.status)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bank-card p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-green-800 mb-1">eKira Hakkında</h4>
              <p className="text-[10px] text-green-700 leading-relaxed">
                Kira sözleşmelerinizi oluşturun, e-Devlet'e aktarın ve kiracılarınızdan iyzico ile tahsilat yapın. 
                Tüm kira sürecinizi tek yerden yönetin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EkiraDashboard;
