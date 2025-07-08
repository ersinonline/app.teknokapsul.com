import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
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
    let q = query(expensesRef, orderBy('recurringDay', 'asc'), orderBy('date', 'asc'));
    
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
      date: data.isRecurring && data.recurringDay 
        ? calculateNextDate(data.recurringDay, data.date).toISOString()
        : data.date || new Date().toISOString(),
      isActive: data.isActive ?? true,
      isPaid: data.isPaid ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'teknokapsul', userId, 'expenses'), expenseData);
    
    // Düzenli gider ise, belirtilen ay sayısı kadar gelecek aylara da ekle
    if (data.isRecurring && data.recurringMonths && data.recurringMonths > 1) {
      await createRecurringExpenses(userId, expenseData, data.recurringMonths - 1);
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

const createRecurringExpenses = async (userId: string, baseExpense: any, monthsToCreate: number): Promise<void> => {
  try {
    const promises = [];
    const baseDate = new Date(baseExpense.date);
    
    for (let i = 1; i <= monthsToCreate; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      
      const recurringExpense = {
        ...baseExpense,
        date: nextDate.toISOString(),
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      promises.push(addDoc(collection(db, 'teknokapsul', userId, 'expenses'), recurringExpense));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating recurring expenses:', error);
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

    if (data.isRecurring && data.recurringDay) {
      updateData.date = calculateNextDate(data.recurringDay, data.date).toISOString();
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
    
    // Eğer düzenli gider ise, aynı başlık ve kategoriye sahip tüm giderleri sil
    if (expense.isRecurring) {
      await deleteRecurringExpenses(userId, expense.title, expense.category);
    } else {
      // Tek seferlik gider ise sadece kendisini sil
      await deleteDoc(expenseRef);
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Düzenli giderleri silme fonksiyonu
const deleteRecurringExpenses = async (userId: string, title: string, category: string): Promise<void> => {
  try {
    const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
    const q = query(
      expensesRef,
      where('title', '==', title),
      where('category', '==', category),
      where('isRecurring', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting recurring expenses:', error);
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