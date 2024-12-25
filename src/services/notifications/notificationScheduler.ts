import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Event } from '../../types/calendar';
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

export const scheduleEventNotification = async (event: Event) => {
  try {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 30 * 60000);

    await addDoc(collection(db, 'scheduled-notifications'), {
      type: 'event',
      eventId: event.id,
      userId: event.userId,
      scheduledFor: reminderDate.toISOString(),
      title: 'Etkinlik Hatırlatması',
      body: `"${event.title}" etkinliğiniz 30 dakika sonra başlayacak.`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error scheduling event notification:', error);
    throw error;
  }
};