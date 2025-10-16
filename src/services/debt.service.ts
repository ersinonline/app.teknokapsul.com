import { collection, addDoc, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PersonalDebt, PersonalDebtFormData } from '../types/debt';
import { sendDebtNotification } from './email.service';

export const addPersonalDebt = async (userId: string, data: PersonalDebtFormData, userEmail?: string, userName?: string): Promise<void> => {
  try {
    // Add debt to Firestore
    await addDoc(collection(db, 'teknokapsul', userId, 'debts'), {
      ...data,
      status: 'Ödenmedi',
      createdAt: new Date().toISOString()
    });

    // Send email notification if user email is available
    if (userEmail) {
      try {
        await sendDebtNotification({
          to_email: userEmail,
          to_name: userName || 'Kullanıcı',
          debt_description: data.description,
          debt_amount: `${data.amount.toLocaleString('tr-TR')} TL`,
          debt_creditor: data.creditor,
          debt_due_date: new Date(data.dueDate).toLocaleDateString('tr-TR'),
          debt_notes: data.notes
        });
        console.log('Debt notification email sent successfully');
      } catch (emailError) {
        console.warn('Failed to send debt notification email:', emailError);
        // Don't throw error for email failure - debt should still be saved
      }
    }
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