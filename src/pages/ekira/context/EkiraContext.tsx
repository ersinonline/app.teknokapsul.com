import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, collectionGroup, getDocs, query, where } from 'firebase/firestore';

export type ActiveRole = 'landlord' | 'tenant';

interface EkiraContextType {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  loading: boolean;
  activeRole: ActiveRole;
  switchRole: (role: ActiveRole) => void;
  memberData: any;
  isLandlord: boolean;
  isTenant: boolean;
  isAdmin: boolean;
  tenantContracts: any[];
  refreshMember: () => Promise<void>;
}

const EkiraContext = createContext<EkiraContextType>({
  uid: null,
  email: null,
  displayName: null,
  loading: true,
  activeRole: 'landlord',
  switchRole: () => {},
  memberData: null,
  isLandlord: false,
  isTenant: false,
  isAdmin: false,
  tenantContracts: [],
  refreshMember: async () => {},
});

export const useEkira = () => useContext(EkiraContext);

export const EkiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<ActiveRole>('landlord');
  const [memberData, setMemberData] = useState<any>(null);
  const [tenantContracts, setTenantContracts] = useState<any[]>([]);

  const uid = user?.uid || null;
  const email = user?.email || null;
  const displayName = user?.displayName || null;
  const isAdmin = email === 'clk.ersinnn@gmail.com';
  const isLandlord = Boolean(uid);
  const isTenant = Boolean(uid);

  const loadMember = async () => {
    if (!uid) {
      setMemberData(null);
      setTenantContracts([]);
      setLoading(false);
      return;
    }
    try {
      const memberRef = doc(db, 'accounts', uid, 'members', uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const data = memberSnap.data();
        if (data?.roles?.agent && !data?.agentId) {
          const agentId = `AG-${uid.slice(0, 8).toUpperCase()}`;
          await setDoc(memberRef, { agentId }, { merge: true });
          setMemberData({ ...data, agentId });
        } else {
          setMemberData(data);
        }
      } else {
        setMemberData(null);
      }
    } catch {
      setMemberData(null);
    }

    // Load tenant contracts
    if (email) {
      try {
        const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', email));
        const snap = await getDocs(q);
        const contracts = snap.docs
          .filter((d) => {
            const s = d.data().status;
            return s === 'ACTIVE' || s === 'EDEVLET_APPROVED' || s === 'DRAFT_READY';
          })
          .map((d) => {
            const parts = d.ref.path.split('/');
            return { id: d.id, ownerUid: parts[1], ...d.data() };
          });
        setTenantContracts(contracts);
      } catch {
        setTenantContracts([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMember();
  }, [uid, email]);

  useEffect(() => {
    if (!uid) return;
    const saved = localStorage.getItem(`ekira_role_${uid}`);
    if (saved === 'tenant' && isTenant) {
      setActiveRole('tenant');
    } else if (saved === 'landlord' && isLandlord) {
      setActiveRole('landlord');
    }
  }, [uid, isLandlord, isTenant]);

  const switchRole = (role: ActiveRole) => {
    setActiveRole(role);
    if (uid) localStorage.setItem(`ekira_role_${uid}`, role);
  };

  return (
    <EkiraContext.Provider value={{
      uid, email, displayName, loading, activeRole, switchRole,
      memberData, isLandlord, isTenant, isAdmin, tenantContracts,
      refreshMember: loadMember
    }}>
      {children}
    </EkiraContext.Provider>
  );
};
