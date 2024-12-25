import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note } from '../types/notes';

export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const addNote = async (note: Omit<Note, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'notes'), note);
    return docRef.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

export const updateNote = async (note: Note) => {
  try {
    const noteRef = doc(db, 'notes', note.id);
    const { id, ...updateData } = note;
    await updateDoc(noteRef, updateData);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};