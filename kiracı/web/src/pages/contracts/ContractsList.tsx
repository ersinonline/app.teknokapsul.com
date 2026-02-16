import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { contractStatusLabel } from '../../utils/status';

interface Contract {
  id: string;
  propertyId: string;
  tenant: {
    name: string;
    email: string;
  };
  rentAmount: number;
  startDate: any; // Timestamp
  status: string;
  role?: 'landlord' | 'tenant' | 'agent';
}

const ContractsList: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMap, setPendingMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user || !user.email) return;
      try {
        const fetchedContracts: Contract[] = [];

        // 1. Fetch contracts where I am the LANDLORD
        // Path: accounts/{uid}/contracts
        const landlordQ = query(collection(db, 'accounts', user.uid, 'contracts'));
        const landlordSnap = await getDocs(landlordQ);
        
        landlordSnap.forEach((doc) => {
          const data = doc.data();
          fetchedContracts.push({
            id: doc.id,
            propertyId: data.propertyId,
            tenant: data.tenant,
            rentAmount: data.rentAmount,
            startDate: data.startDate,
            status: data.status,
            role: 'landlord'
          });
        });

        // 2. Fetch contracts where I am the TENANT (using Collection Group Query)
        // This queries all 'contracts' subcollections where tenant.email matches
        // NOTE: This requires a composite index in Firestore if combined with other filters.
        // For MVP with simple equality, it might work or ask for index creation in console.
        const tenantQ = query(
          collectionGroup(db, 'contracts'),
          where('tenant.email', '==', user.email)
        );
        
        const tenantSnap = await getDocs(tenantQ);
        tenantSnap.forEach((doc) => {
          // Avoid duplicates if I am both landlord and tenant (unlikely but possible in testing)
          if (!fetchedContracts.find(c => c.id === doc.id)) {
            const data = doc.data();
            fetchedContracts.push({
              id: doc.id,
              propertyId: data.propertyId,
              tenant: data.tenant,
              rentAmount: data.rentAmount,
              startDate: data.startDate,
              status: data.status,
              role: 'tenant'
            });
          }
        });

        // 3. Fetch contracts where I am the AGENT
        const agentQ = query(collectionGroup(db, 'contracts'), where('agentUid', '==', user.uid));
        const agentSnap = await getDocs(agentQ);
        agentSnap.forEach((doc) => {
          if (!fetchedContracts.find(c => c.id === doc.id)) {
            const data = doc.data();
            fetchedContracts.push({
              id: doc.id,
              propertyId: data.propertyId,
              tenant: data.tenant,
              rentAmount: data.rentAmount,
              startDate: data.startDate,
              status: data.status,
              role: 'agent',
            });
          }
        });
        
        // Filter by active role
        const filtered = fetchedContracts.filter((c) => {
          if (activeRole === 'tenant') return c.role === 'tenant';
          if (activeRole === 'landlord') return c.role === 'landlord' || c.role === 'agent';
          return true;
        });
        setContracts(filtered);
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [user, activeRole]);

  useEffect(() => {
    const fetchPending = async () => {
      if (!user) return;
      try {
        const q = query(collectionGroup(db, 'requests'), where('status', '==', 'PENDING'));
        const snap = await getDocs(q);
        const map: Record<string, number> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const isLandlord = data.ownerUid === user.uid || data.landlordUid === user.uid;
          const isTenant = user.email && data.tenantEmail && data.tenantEmail.toLowerCase() === user.email.toLowerCase();
          if (!isLandlord && !isTenant) return;
          const cid = data.contractId || d.ref.path.split('/')[5];
          if (cid) map[cid] = (map[cid] || 0) + 1;
        });
        setPendingMap(map);
      } catch {
        setPendingMap({});
      }
    };
    fetchPending();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT_READY: 'badge badge-muted',
      EDEVLET_TRANSFERRED: 'badge badge-warning',
      EDEVLET_PENDING: 'badge badge-info',
      EDEVLET_APPROVED: 'badge badge-success',
      ACTIVE: 'badge badge-success',
      CANCELLED: 'badge badge-warning',
    };
    return (
      <span className={`${styles[status] || 'badge badge-muted'}`}>
        {contractStatusLabel(status)}
      </span>
    );
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{activeRole === 'tenant' ? 'Sözleşmelerim' : 'Sözleşmeler'}</h1>
          <p className="page-subtitle">{activeRole === 'tenant' ? 'Kiracı olduğunuz sözleşmeler.' : 'Ev sahibi olduğunuz kira sözleşmeleri.'}</p>
        </div>
        {activeRole === 'landlord' && (
          <Link to="/contracts/new" className="btn btn-primary">
            Yeni Sözleşme
          </Link>
        )}
      </div>

      {contracts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
            </svg>
            <p className="empty-state-title">Henüz sözleşme bulunmuyor</p>
            <p className="empty-state-text">İlk sözleşmenizi oluşturarak kira yönetimine başlayın.</p>
            <Link to="/contracts/new" className="btn btn-primary mt-4">Yeni Sözleşme Oluştur</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap hidden sm:block">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Kiracı</th>
                  <th className="table-cell">Rol</th>
                  <th className="table-cell">Tutar</th>
                  <th className="table-cell">Başlangıç</th>
                  <th className="table-cell">Durum</th>
                  <th className="table-cell text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-900">{contract.tenant.name}</td>
                    <td className="table-cell">
                      {contract.role === 'landlord' && <span className="badge badge-info">Ev Sahibi</span>}
                      {contract.role === 'tenant' && <span className="badge badge-warning">Kiracı</span>}
                      {contract.role === 'agent' && <span className="badge badge-muted">Emlakçı</span>}
                    </td>
                    <td className="table-cell">{contract.rentAmount} ₺</td>
                    <td className="table-cell">
                      {contract.startDate?.toDate ? new Date(contract.startDate.toDate()).toLocaleDateString('tr-TR') : ''}
                    </td>
                    <td className="table-cell">{getStatusBadge(contract.status)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        {pendingMap[contract.id] ? (
                          <span className="badge badge-danger">{pendingMap[contract.id]} talep</span>
                        ) : null}
                        <Link to={`/contracts/${contract.id}`} className="btn btn-ghost text-teal-700 text-xs px-3 py-1">
                          Detay →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {contracts.map((contract) => (
              <Link key={contract.id} to={`/contracts/${contract.id}`} className="card p-4 block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{contract.tenant.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {contract.rentAmount} ₺ · {contract.startDate?.toDate ? new Date(contract.startDate.toDate()).toLocaleDateString('tr-TR') : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {getStatusBadge(contract.status)}
                    {contract.role === 'landlord' && <span className="badge badge-info text-[10px]">Ev Sahibi</span>}
                    {contract.role === 'tenant' && <span className="badge badge-warning text-[10px]">Kiracı</span>}
                    {contract.role === 'agent' && <span className="badge badge-muted text-[10px]">Emlakçı</span>}
                  </div>
                </div>
                {pendingMap[contract.id] ? (
                  <div className="mt-2">
                    <span className="badge badge-danger text-[10px]">{pendingMap[contract.id]} bekleyen talep</span>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ContractsList;
