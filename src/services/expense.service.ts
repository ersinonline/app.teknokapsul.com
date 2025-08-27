import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Expense, ExpenseFormData } from '../types/expense';

const calculateNextDate = (recurringDay: number, startDate?: string): Date => {
  if (startDate) {
    const baseDate = new Date(startDate);
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), recurringDay);
  }
  
  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth(), recurringDay);
  
  // Eğer seçilen gün bugünden önceyse, bir sonraki aya ayarla
  if (nextDate < today) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
};

export const getUserExpenses = async (userId: string, year?: number, month?: number): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
    let q = query(expensesRef, orderBy('installmentDay', 'asc'), orderBy('date', 'asc'));
    
    if (year && month) {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
      q = query(expensesRef, 
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
    
    return expenses;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const addExpense = async (userId: string, data: ExpenseFormData): Promise<void> => {
  try {
    const expenseData = {
      ...data,
      date: data.isInstallment && data.installmentDay 
        ? calculateNextDate(data.installmentDay, data.date).toISOString()
        : data.date || new Date().toISOString(),
      isActive: data.isActive ?? true,
      isPaid: data.isPaid ?? false,
      installmentNumber: data.isInstallment ? (data.installmentNumber || 1) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'teknokapsul', userId, 'expenses'), expenseData);
    
    // Taksitli ödeme ise, belirtilen taksit sayısı kadar gelecek aylara da ekle
    if (data.isInstallment && data.totalInstallments && data.totalInstallments > 1) {
      await createInstallmentExpenses(userId, expenseData, data.totalInstallments - 1);
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

const createInstallmentExpenses = async (userId: string, baseExpense: any, installmentsToCreate: number): Promise<void> => {
  try {
    const promises = [];
    const baseDate = new Date(baseExpense.date);
    
    for (let i = 1; i <= installmentsToCreate; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      
      const installmentExpense = {
        ...baseExpense,
        date: nextDate.toISOString(),
        installmentNumber: (baseExpense.installmentNumber || 1) + i,
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      promises.push(addDoc(collection(db, 'teknokapsul', userId, 'expenses'), installmentExpense));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating installment expenses:', error);
    throw error;
  }
};

export const updateExpense = async (
  userId: string,
  expenseId: string,
  data: Partial<ExpenseFormData>
): Promise<void> => {
  try {
    const expenseRef = doc(db, 'teknokapsul', userId, 'expenses', expenseId);
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (data.isInstallment && data.installmentDay) {
      updateData.date = calculateNextDate(data.installmentDay, data.date).toISOString();
    }

    await updateDoc(expenseRef, updateData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  try {
    // Önce silinecek gideri al
    const expenseRef = doc(db, 'teknokapsul', userId, 'expenses', expenseId);
    const expenseDoc = await getDocs(query(collection(db, 'teknokapsul', userId, 'expenses'), where('__name__', '==', expenseId)));
    
    if (expenseDoc.empty) {
      throw new Error('Expense not found');
    }
    
    const expense = expenseDoc.docs[0].data() as Expense;
    
    // Eğer taksitli ödeme ise, aynı başlık ve kategoriye sahip tüm taksitleri sil
    if (expense.isInstallment) {
      await deleteInstallmentExpenses(userId, expense.title, expense.category);
    } else {
      // Tek seferlik gider ise sadece kendisini sil
      await deleteDoc(expenseRef);
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Taksitli ödemeleri silme fonksiyonu
const deleteInstallmentExpenses = async (userId: string, title: string, category: string): Promise<void> => {
  try {
    const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
    const q = query(
      expensesRef,
      where('title', '==', title),
      where('category', '==', category),
      where('isInstallment', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting installment expenses:', error);
    throw error;
  }
};

export const toggleExpenseStatus = async (userId: string, expenseId: string, isActive: boolean): Promise<void> => {
  try {
    const expenseRef = doc(db, 'teknokapsul', userId, 'expenses', expenseId);
    await updateDoc(expenseRef, { 
      isActive,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling expense status:', error);
    throw error;
  }
};

export const toggleExpensePayment = async (userId: string, expenseId: string, isPaid: boolean): Promise<void> => {
  try {
    const expenseRef = doc(db, 'teknokapsul', userId, 'expenses', expenseId);
    await updateDoc(expenseRef, { 
      isPaid,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling expense payment:', error);
    throw error;
  }
};