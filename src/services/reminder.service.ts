import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PaymentReminder {
  userId: string;
  paymentId: string;
  reminderDate: string;
  notificationMethod: 'email' | 'push' | 'sms';
  reminderType: 'once' | 'daily' | 'weekly';
  status: 'active' | 'completed';
}

export const createPaymentReminder = async (userId: string, reminder: Omit<PaymentReminder, 'status' | 'userId'>) => {
  try {
    await addDoc(collection(db, 'teknokapsul', userId, 'reminders'), {
      ...reminder,
      userId,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};