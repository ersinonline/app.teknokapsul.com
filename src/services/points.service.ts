import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserPoints {
  id?: string;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  createdAt?: any;
  updatedAt?: any;
}

export const getUserPoints = async (userId: string): Promise<UserPoints> => {
  try {
    const pointsRef = doc(db, 'teknokapsul', userId, 'points', 'summary');
    const docSnap = await getDoc(pointsRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserPoints;
    } else {
      // İlk kez puan sistemi kullanılıyor, varsayılan değerler oluştur
      const defaultPoints: UserPoints = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(pointsRef, defaultPoints);
      return defaultPoints;
    }
  } catch (error) {
    console.error('Error getting user points:', error);
    throw error;
  }
};

export const addPoints = async (userId: string, points: number, source: string = 'game'): Promise<void> => {
  try {
    const pointsRef = doc(db, 'teknokapsul', userId, 'points', 'summary');
    
    await updateDoc(pointsRef, {
      totalPoints: increment(points),
      availablePoints: increment(points),
      updatedAt: serverTimestamp()
    });
    
    console.log(`${points} puan eklendi. Kaynak: ${source}`);
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

export const usePoints = async (userId: string, points: number): Promise<boolean> => {
  try {
    const pointsRef = doc(db, 'teknokapsul', userId, 'points', 'summary');
    const currentPoints = await getUserPoints(userId);
    
    if (currentPoints.availablePoints >= points) {
      await updateDoc(pointsRef, {
        availablePoints: increment(-points),
        usedPoints: increment(points),
        updatedAt: serverTimestamp()
      });
      return true;
    } else {
      return false; // Yetersiz puan
    }
  } catch (error) {
    console.error('Error using points:', error);
    throw error;
  }
};