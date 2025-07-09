import { collection, addDoc, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonalDebt, PersonalDebtFormData } from '../types/debt';

export const addPersonalDebt = async (userId: string, data: PersonalDebtFormData): Promise<void> => {
  try {
    await addDoc(collection(db, 'teknokapsul', userId, 'debts'), {
      ...data,
      status: 'Ödenmedi',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding personal debt:', error);
    throw error;
  }
};

export const updateDebtStatus = async (userId: string, debtId: string, status: 'Ödenmedi' | 'Ödendi'): Promise<void> => {
  try {
    const debtRef = doc(db, 'teknokapsul', userId, 'debts', debtId);
    await updateDoc(debtRef, { status });
  } catch (error) {
    console.error('Error updating debt status:', error);
    throw error;
  }
};

export const getUserPersonalDebts = async (userId: string): Promise<PersonalDebt[]> => {
  try {
    const debtsRef = collection(db, 'teknokapsul', userId, 'debts');
    const q = query(debtsRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersonalDebt));
  } catch (error) {
    console.error('Error fetching personal debts:', error);
    throw error;
  }
};