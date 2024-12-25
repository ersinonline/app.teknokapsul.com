import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AutoPayment {
  userId: string;
  paymentId: string;
  scheduledDate: string;
  amount: number;
  bankAccount: string;
  status: 'scheduled' | 'completed' | 'failed';
}

export const scheduleAutoPayment = async (payment: Omit<AutoPayment, 'status'>) => {
  try {
    await addDoc(collection(db, 'auto-payments'), {
      ...payment,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scheduling payment:', error);
    throw error;
  }
};