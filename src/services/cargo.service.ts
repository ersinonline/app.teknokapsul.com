import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CargoTracking } from '../types/cargo';



export const addCargoTracking = async (userId: string, cargoData: Omit<CargoTracking, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'cargo'), {
      ...cargoData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding cargo tracking:', error);
    throw error;
  }
};

export const getUserCargoTrackings = async (userId: string): Promise<CargoTracking[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul', userId, 'cargo'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as CargoTracking[];
  } catch (error) {
    console.error('Error getting cargo trackings:', error);
    throw error;
  }
};

export const updateCargoTracking = async (userId: string, id: string, updates: Partial<Omit<CargoTracking, 'id' | 'createdAt' | 'userId'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'teknokapsul', userId, 'cargo', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating cargo tracking:', error);
    throw error;
  }
};

export const deleteCargoTracking = async (userId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul', userId, 'cargo', id));
  } catch (error) {
    console.error('Error deleting cargo tracking:', error);
    throw error;
  }
};

export const generateTrackingUrl = (trackingNumber: string, urlTemplate: string): string => {
  return urlTemplate.replace('${trackingNumber}', encodeURIComponent(trackingNumber));
};