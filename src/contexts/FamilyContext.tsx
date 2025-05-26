import React, { createContext, useContext, useState, useEffect } from 'react';
<<<<<<< HEAD
import { collection, query, where, getDocs } from 'firebase/firestore';
=======
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
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
<<<<<<< HEAD
    // Implementation for inviting family members
  };

  const removeMember = async (memberId: string) => {
    // Implementation for removing family members
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    // Implementation for updating member roles
=======
    if (!user) throw new Error('User must be logged in');
    
    try {
      await addDoc(collection(db, 'family-members'), {
        email,
        familyId: user.uid,
        role: 'member',
        permissions: ['view'],
        createdAt: new Date().toISOString()
      });
      
      // Reload family members
      const familyRef = collection(db, 'family-members');
      const q = query(familyRef, where('familyId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FamilyMember));
      
      setFamilyMembers(members);
    } catch (err) {
      setError('Failed to invite family member');
      console.error(err);
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await deleteDoc(doc(db, 'family-members', memberId));
      
      // Update local state
      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      setError('Failed to remove family member');
      console.error(err);
      throw err;
    }
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      const memberRef = doc(db, 'family-members', memberId);
      await updateDoc(memberRef, {
        role,
        permissions: role === 'admin' ? ['view', 'edit', 'delete'] : ['view']
      });
      
      // Update local state
      setFamilyMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role, permissions: role === 'admin' ? ['view', 'edit', 'delete'] : ['view'] }
            : member
        )
      );
    } catch (err) {
      setError('Failed to update member role');
      console.error(err);
      throw err;
    }
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
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