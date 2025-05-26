import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Family {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

interface FamilyContextType {
  families: Family[];
  loading: boolean;
  error: Error | null;
  addFamily: (name: string) => Promise<void>;
  updateFamily: (id: string, name: string) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  refreshFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFamilies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'families'),
        where('members', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const loadedFamilies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Family));
      setFamilies(loadedFamilies);
      setError(null);
    } catch (err) {
      console.error('Error loading families:', err);
      setError(err instanceof Error ? err : new Error('Aileler yüklenirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, [user]);

  const addFamily = async (name: string) => {
    if (!user) throw new Error('Kullanıcı girişi gerekli');

    try {
      const familyData = {
        name,
        members: [user.uid],
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'families'), familyData);
      await loadFamilies();
    } catch (err) {
      console.error('Error adding family:', err);
      throw err instanceof Error ? err : new Error('Aile eklenirken bir hata oluştu.');
    }
  };

  const updateFamily = async (id: string, name: string) => {
    if (!user) throw new Error('Kullanıcı girişi gerekli');

    try {
      const familyRef = doc(db, 'families', id);
      await updateDoc(familyRef, { name });
      await loadFamilies();
    } catch (err) {
      console.error('Error updating family:', err);
      throw err instanceof Error ? err : new Error('Aile güncellenirken bir hata oluştu.');
    }
  };

  const deleteFamily = async (id: string) => {
    if (!user) throw new Error('Kullanıcı girişi gerekli');

    try {
      const familyRef = doc(db, 'families', id);
      await deleteDoc(familyRef);
      await loadFamilies();
    } catch (err) {
      console.error('Error deleting family:', err);
      throw err instanceof Error ? err : new Error('Aile silinirken bir hata oluştu.');
    }
  };

  const value = {
    families,
    loading,
    error,
    addFamily,
    updateFamily,
    deleteFamily,
    refreshFamilies: loadFamilies
  };

  return (
    <FamilyContext.Provider value={value}>
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