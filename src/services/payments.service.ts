import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment } from '../types/data';
import { addLoyaltyPoints } from './loyalty.service';

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, userId: string, newStatus: string): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status: newStatus,
    });

    // Ödeme tamamlandığında puan ver
    if (newStatus === 'Ödendi') {
      await addLoyaltyPoints(userId, 'PAYMENT_COMPLETED', 'Borç ödemesi tamamlandı');
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await deleteDoc(paymentRef);
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};