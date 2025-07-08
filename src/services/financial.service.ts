import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditCard, CashAdvanceAccount, Loan, LoanPayment } from '../types/financial';

// Kredi Kartı İşlemleri
export const addCreditCard = async (creditCard: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'teknokapsul'), {
      ...creditCard,
      type: 'creditCard',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding credit card:', error);
    throw error;
  }
};

export const getCreditCards = async (userId: string): Promise<CreditCard[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul'),
      where('userId', '==', userId),
      where('type', '==', 'creditCard'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as CreditCard[];
  } catch (error) {
    console.error('Error getting credit cards:', error);
    throw error;
  }
};

export const updateCreditCard = async (id: string, updates: Partial<CreditCard>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating credit card:', error);
    throw error;
  }
};

export const deleteCreditCard = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', id));
  } catch (error) {
    console.error('Error deleting credit card:', error);
    throw error;
  }
};

// Avans Hesabı İşlemleri
export const addCashAdvanceAccount = async (account: Omit<CashAdvanceAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'teknokapsul'), {
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
      collection(db, 'teknokapsul'),
      where('userId', '==', userId),
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

export const updateCashAdvanceAccount = async (id: string, updates: Partial<CashAdvanceAccount>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating cash advance account:', error);
    throw error;
  }
};

export const deleteCashAdvanceAccount = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', id));
  } catch (error) {
    console.error('Error deleting cash advance account:', error);
    throw error;
  }
};

// Kredi İşlemleri
export const addLoan = async (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'teknokapsul'), {
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
      collection(db, 'teknokapsul'),
      where('userId', '==', userId),
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

export const updateLoan = async (id: string, updates: Partial<Loan>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', id);
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

export const deleteLoan = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', id));
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

// Kredi Ödeme İşlemleri
export const addLoanPayment = async (payment: Omit<LoanPayment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'teknokapsul'), {
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

export const getLoanPayments = async (loanId: string): Promise<LoanPayment[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul'),
      where('type', '==', 'loanPayment'),
      where('loanId', '==', loanId),
      orderBy('paymentDate', 'desc')
    );
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