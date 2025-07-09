import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CargoTracking } from '../types/cargo';

const COLLECTION_NAME = 'cargoTracking';

export const addCargoTracking = async (cargoData: Omit<CargoTracking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
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
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
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

export const updateCargoTracking = async (id: string, updates: Partial<Omit<CargoTracking, 'id' | 'createdAt' | 'userId'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating cargo tracking:', error);
    throw error;
  }
};

export const deleteCargoTracking = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting cargo tracking:', error);
    throw error;
  }
};

export const generateTrackingUrl = (trackingNumber: string, urlTemplate: string): string => {
  return urlTemplate.replace('${trackingNumber}', encodeURIComponent(trackingNumber));
};