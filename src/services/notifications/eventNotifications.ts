import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Event } from '../../types/calendar';

export const scheduleEventNotification = async (event: Event & { id: string }) => {
  try {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 30 * 60000); // 30 dakika önce

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