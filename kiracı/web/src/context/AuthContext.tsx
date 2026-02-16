import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collectionGroup, getDocs, query, where } from 'firebase/firestore';

export type ActiveRole = 'landlord' | 'tenant';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  activeRole: ActiveRole;
  switchRole: (role: ActiveRole) => void;
  memberData: any;
  isLandlord: boolean;
  isTenant: boolean;
  isAdmin: boolean;
  tenantContracts: any[];
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  activeRole: 'landlord',
  switchRole: () => {},
  memberData: null,
  isLandlord: false,
  isTenant: false,
  isAdmin: false,
  tenantContracts: [],
  refreshMember: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<ActiveRole>('landlord');
  const [memberData, setMemberData] = useState<any>(null);
  const [tenantContracts, setTenantContracts] = useState<any[]>([]);

  const isAdmin = user?.email === 'clk.ersinnn@gmail.com';
  // Everyone can be both landlord and tenant — role switch always available
  const isLandlord = Boolean(user);
  const isTenant = Boolean(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setMemberData(null);
        setTenantContracts([]);
        setActiveRole('landlord');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadMember = async () => {
    if (!user) return;
    try {
      const memberRef = doc(db, 'accounts', user.uid, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const data = memberSnap.data();
        if (data?.roles?.agent && !data?.agentId) {
          const agentId = `AG-${user.uid.slice(0, 8).toUpperCase()}`;
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
    if (user.email) {
      try {
        const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
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
  };

  useEffect(() => {
    loadMember();
  }, [user]);

  // Auto-select role based on what user has
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`ekira_role_${user.uid}`);
    if (saved === 'tenant' && isTenant) {
      setActiveRole('tenant');
    } else if (saved === 'landlord' && isLandlord) {
      setActiveRole('landlord');
    } else if (isLandlord) {
      setActiveRole('landlord');
    } else if (isTenant) {
      setActiveRole('tenant');
    }
  }, [user, isLandlord, isTenant]);

  const switchRole = (role: ActiveRole) => {
    setActiveRole(role);
    if (user) localStorage.setItem(`ekira_role_${user.uid}`, role);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, activeRole, switchRole, memberData, isLandlord, isTenant, isAdmin, tenantContracts, refreshMember: loadMember }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
