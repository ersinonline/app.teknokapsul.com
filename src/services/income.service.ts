import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Income, IncomeFormData } from '../types/income';

const calculateNextDate = (recurringDay: number, startDate?: string): Date => {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), recurringDay);
  
  // Eğer seçilen gün base tarihten önceyse, bir sonraki aya ayarla
  if (nextDate < baseDate) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
};

export const getUserIncomes = async (userId: string, year?: number, month?: number): Promise<Income[]> => {
  try {
    const incomesRef = collection(db, 'teknokapsul', userId, 'incomes');
    let q = query(incomesRef, orderBy('recurringDay', 'asc'), orderBy('date', 'asc'));
    
    if (year && month) {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
      q = query(incomesRef, 
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const incomes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Income));
    
    return incomes;
  } catch (error) {
    console.error('Error fetching incomes:', error);
    throw error;
  }
};

export const addIncome = async (userId: string, data: IncomeFormData): Promise<void> => {
  try {
    const incomeData = {
      ...data,
      date: data.isRecurring && data.recurringDay 
        ? calculateNextDate(data.recurringDay, data.startDate).toISOString()
        : data.date || new Date().toISOString(),
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'teknokapsul', userId, 'incomes'), incomeData);
    
    // Düzenli gelir ise, 12 ay boyunca gelecek aylara da ekle
    if (data.isRecurring) {
      await createRecurringIncomes(userId, incomeData, 11); // 11 ay daha ekle (toplam 12 ay)
    }
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
};

const createRecurringIncomes = async (userId: string, baseIncome: any, monthsToCreate: number): Promise<void> => {
  try {
    const promises = [];
    const baseDate = new Date(baseIncome.date);
    
    for (let i = 1; i <= monthsToCreate; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      
      const recurringIncome = {
        ...baseIncome,
        date: nextDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      promises.push(addDoc(collection(db, 'teknokapsul', userId, 'incomes'), recurringIncome));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating recurring incomes:', error);
    throw error;
  }
};

export const updateIncome = async (
  userId: string,
  incomeId: string,
  data: Partial<IncomeFormData>
): Promise<void> => {
  try {
    const incomeRef = doc(db, 'teknokapsul', userId, 'incomes', incomeId);
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (data.isRecurring && data.recurringDay) {
      updateData.date = calculateNextDate(data.recurringDay, data.startDate).toISOString();
    }

    await updateDoc(incomeRef, updateData);
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
};

export const deleteIncome = async (userId: string, incomeId: string): Promise<void> => {
  try {
    // Önce silinecek geliri al
    const incomeRef = doc(db, 'teknokapsul', userId, 'incomes', incomeId);
    const incomeDoc = await getDocs(query(collection(db, 'teknokapsul', userId, 'incomes'), where('__name__', '==', incomeId)));
    
    if (incomeDoc.empty) {
      throw new Error('Income not found');
    }
    
    const income = incomeDoc.docs[0].data() as Income;
    
    // Eğer düzenli gelir ise, aynı başlık ve kategoriye sahip tüm gelirleri sil
    if (income.isRecurring) {
      await deleteRecurringIncomes(userId, income.title, income.category);
    } else {
      // Tek seferlik gelir ise sadece kendisini sil
      await deleteDoc(incomeRef);
    }
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// Düzenli gelirleri silme fonksiyonu
const deleteRecurringIncomes = async (userId: string, title: string, category: string): Promise<void> => {
  try {
    const incomesRef = collection(db, 'teknokapsul', userId, 'incomes');
    const q = query(
      incomesRef,
      where('title', '==', title),
      where('category', '==', category),
      where('isRecurring', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting recurring incomes:', error);
    throw error;
  }
};

export const toggleIncomeStatus = async (userId: string, incomeId: string, isActive: boolean): Promise<void> => {
  try {
    const incomeRef = doc(db, 'teknokapsul', userId, 'incomes', incomeId);
    await updateDoc(incomeRef, { 
      isActive,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling income status:', error);
    throw error;
  }
};