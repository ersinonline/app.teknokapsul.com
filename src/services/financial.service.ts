import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditCard, CashAdvanceAccount, Loan, LoanPayment } from '../types/financial';
import { offlineService } from './offline.service';

// Kredi Kartı İşlemleri
export const addCreditCard = async (userId: string, creditCard: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const now = new Date();
    const newCard = {
      ...creditCard,
      type: 'creditCard',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };
    
    if (navigator.onLine) {
      const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'financial'), newCard);
      
      // Save to offline storage
      const cardWithId = { id: docRef.id, ...newCard };
      await offlineService.saveData('creditCards', cardWithId);
      
      return docRef.id;
    } else {
      // Generate temporary ID for offline
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const cardWithId = { id: tempId, ...newCard };
      
      // Save to offline storage and queue for sync
      await offlineService.saveData('creditCards', cardWithId);
      await offlineService.addToSyncQueue('create', 'creditCard', cardWithId, userId);
      
      return tempId;
    }
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
};

export const getCreditCards = async (userId: string): Promise<CreditCard[]> => {
  try {
    if (navigator.onLine) {
      const q = query(
        collection(db, 'teknokapsul', userId, 'financial'),
        where('type', '==', 'creditCard'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const cards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as CreditCard[];
      
      // Save to offline storage
      for (const card of cards) {
        await offlineService.saveData('creditCards', card);
      }
      
      return cards;
    } else {
      // Get from offline storage
      const offlineCards = await offlineService.getData('creditCards');
      return offlineCards || [];
    }
  } catch (error) {
    console.error('Error getting credit cards:', error);
    // Fallback to offline data
    const offlineCards = await offlineService.getData('creditCards');
    return offlineCards || [];
  }
};

export const updateCreditCard = async (userId: string, id: string, updates: Partial<CreditCard>): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    if (navigator.onLine) {
      const docRef = doc(db, 'teknokapsul', userId, 'financial', id);
      await updateDoc(docRef, updateData);
      
      // Update offline storage
      const existingCard = await offlineService.getData('creditCards', id);
      if (existingCard) {
        await offlineService.saveData('creditCards', { ...existingCard, ...updateData });
      }
    } else {
      // Save to offline storage and queue for sync
      const existingCard = await offlineService.getData('creditCards', id);
      if (existingCard) {
        await offlineService.saveData('creditCards', { ...existingCard, ...updateData });
      }
      await offlineService.addToSyncQueue('update', 'creditCard', { id, ...updateData }, userId);
    }
  } catch (error) {
    console.error('Error updating credit card:', error);
    throw error;
  }
};

export const deleteCreditCard = async (userId: string, id: string): Promise<void> => {
  try {
    if (navigator.onLine) {
      await deleteDoc(doc(db, 'teknokapsul', userId, 'financial', id));
      // Remove from offline storage
      await offlineService.deleteData('creditCards', id);
    } else {
      // Remove from offline storage and queue for sync
      await offlineService.deleteData('creditCards', id);
      await offlineService.addToSyncQueue('delete', 'creditCard', { id }, userId);
    }
  } catch (error) {
    console.error('Error deleting credit card:', error);
    throw error;
  }
};

// Avans Hesabı İşlemleri
export const addCashAdvanceAccount = async (userId: string, account: Omit<CashAdvanceAccount, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'financial'), {
      ...account,
      type: 'cashAdvance',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding cash advance account:', error);
    throw error;
  }
};

export const getCashAdvanceAccounts = async (userId: string): Promise<CashAdvanceAccount[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul', userId, 'financial'),
      where('type', '==', 'cashAdvance'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate?.() || new Date()),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt?.toDate?.() || new Date())
      };
    }) as CashAdvanceAccount[];
  } catch (error) {
    console.error('Error getting cash advance accounts:', error);
    throw error;
  }
};

export const updateCashAdvanceAccount = async (userId: string, id: string, updates: Partial<CashAdvanceAccount>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', userId, 'financial', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating cash advance account:', error);
    throw error;
  }
};

export const deleteCashAdvanceAccount = async (userId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'financial', id));
  } catch (error) {
    console.error('Error deleting cash advance account:', error);
    throw error;
  }
};

// Kredi İşlemleri
export const addLoan = async (userId: string, loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'financial'), {
      ...loan,
      type: 'loan',
      startDate: Timestamp.fromDate(loan.startDate),
      endDate: Timestamp.fromDate(loan.endDate),
      nextPaymentDate: Timestamp.fromDate(loan.nextPaymentDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding loan:', error);
    throw error;
  }
};

export const getLoans = async (userId: string): Promise<Loan[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul', userId, 'financial'),
      where('type', '==', 'loan'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate : (data.startDate?.toDate?.() || new Date()),
        endDate: data.endDate instanceof Date ? data.endDate : (data.endDate?.toDate?.() || new Date()),
        nextPaymentDate: data.nextPaymentDate instanceof Date ? data.nextPaymentDate : (data.nextPaymentDate?.toDate?.() || new Date()),
        createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate?.() || new Date()),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt?.toDate?.() || new Date())
      };
    }) as Loan[];
  } catch (error) {
    console.error('Error getting loans:', error);
    throw error;
  }
};

export const updateLoan = async (userId: string, id: string, updates: Partial<Loan>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', userId, 'financial', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    // Date alanlarını Timestamp'e çevir
    if (updates.startDate) updateData.startDate = Timestamp.fromDate(updates.startDate);
    if (updates.endDate) updateData.endDate = Timestamp.fromDate(updates.endDate);
    if (updates.nextPaymentDate) updateData.nextPaymentDate = Timestamp.fromDate(updates.nextPaymentDate);
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

export const deleteLoan = async (userId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'financial', id));
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

// Kredi Ödeme İşlemleri
export const addLoanPayment = async (userId: string, payment: Omit<LoanPayment, 'id' | 'createdAt' | 'userId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'financial'), {
      ...payment,
      type: 'loanPayment',
      paymentDate: Timestamp.fromDate(payment.paymentDate),
      createdAt: Timestamp.fromDate(new Date())
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding loan payment:', error);
    throw error;
  }
};

export const getLoanPayments = async (userId: string, loanId?: string): Promise<LoanPayment[]> => {
  try {
    let q = query(
      collection(db, 'teknokapsul', userId, 'financial'),
      where('type', '==', 'loanPayment'),
      orderBy('createdAt', 'desc')
    );

    if (loanId) {
      q = query(
        collection(db, 'teknokapsul', userId, 'financial'),
        where('type', '==', 'loanPayment'),
        where('loanId', '==', loanId),
        orderBy('createdAt', 'desc')
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate instanceof Date ? data.paymentDate : (data.paymentDate?.toDate?.() || new Date()),
        createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate?.() || new Date())
      };
    }) as LoanPayment[];
  } catch (error) {
    console.error('Error getting loan payments:', error);
    throw error;
  }
};

// Yardımcı Fonksiyonlar
export const calculateDebtRatio = (currentDebt: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.round((currentDebt / limit) * 100);
};

export const calculateAvailableLimit = (limit: number, currentDebt: number): number => {
  return Math.max(0, limit - currentDebt);
};

export const calculateLoanProgress = (totalInstallments: number, remainingInstallments: number): number => {
  if (totalInstallments === 0) return 0;
  const paidInstallments = totalInstallments - remainingInstallments;
  return Math.round((paidInstallments / totalInstallments) * 100);
};