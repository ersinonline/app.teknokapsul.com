import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  permissions: string[];
}

interface FamilyContextType {
  familyMembers: FamilyMember[];
  inviteMember: (email: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'admin' | 'member') => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!user) return;

      try {
        const familyRef = collection(db, 'family-members');
        const q = query(familyRef, where('familyId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FamilyMember));
        
        setFamilyMembers(members);
      } catch (err) {
        setError('Failed to load family members');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, [user]);

  const inviteMember = async (email: string) => {
    // Implementation for inviting family members
  };

  const removeMember = async (memberId: string) => {
    // Implementation for removing family members
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    // Implementation for updating member roles
  };

  return (
    <FamilyContext.Provider
      value={{
        familyMembers,
        inviteMember,
        removeMember,
        updateMemberRole,
        loading,
        error
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};