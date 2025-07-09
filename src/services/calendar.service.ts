import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Event } from '../types/calendar';

export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'teknokapsul', userId, 'events');
    const querySnapshot = await getDocs(eventsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const addEvent = async (event: Omit<Event, 'id'>, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'events'), event);
    return docRef.id;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string, userId: string) => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};