import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Payment } from '../../types/data';

export const schedulePaymentNotification = async (payment: Payment) => {
  try {
    const paymentDate = new Date(payment.date);
    paymentDate.setHours(12, 0, 0, 0);

    await addDoc(collection(db, 'scheduled-notifications'), {
      type: 'payment',
      paymentId: payment.id,
      userId: payment.userId,
      scheduledFor: paymentDate.toISOString(),
      title: 'Ödeme Hatırlatması',
      body: `${payment.description} için ${payment.amount} ödemeniz bugün yapılmalıdır.`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error scheduling payment notification:', error);
    throw error;
  }
};