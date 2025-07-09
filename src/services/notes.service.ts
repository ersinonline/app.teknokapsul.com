import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note } from '../types/notes';

export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    const notesRef = collection(db, 'teknokapsul', userId, 'notes');
    const querySnapshot = await getDocs(notesRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const addNote = async (note: Omit<Note, 'id'>, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'notes'), note);
    return docRef.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

export const updateNote = async (note: Note, userId: string) => {
  try {
    const noteRef = doc(db, 'teknokapsul', userId, 'notes', note.id);
    const { id, ...updateData } = note;
    await updateDoc(noteRef, updateData);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string, userId: string) => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'notes', noteId));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};