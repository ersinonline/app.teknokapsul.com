import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LoyaltyPoints, LoyaltyAction, POINT_VALUES } from './loyalty/types';

export const getLoyaltyPoints = async (userId: string): Promise<LoyaltyPoints> => {
  const loyaltyRef = doc(db, 'loyalty-points', userId);
  const docSnap = await getDoc(loyaltyRef);
  
  if (!docSnap.exists()) {
    await initializeLoyalty(userId);
    return { totalPoints: 0, history: [] };
  }
  
  return docSnap.data() as LoyaltyPoints;
};

export const initializeLoyalty = async (userId: string) => {
  const loyaltyRef = doc(db, 'loyalty-points', userId);
  await setDoc(loyaltyRef, {
    totalPoints: 0,
    history: []
  });
};

export const addLoyaltyPoints = async (
  userId: string,
  action: LoyaltyAction,
  description: string
) => {
  const points = POINT_VALUES[action];
  const loyaltyRef = doc(db, 'loyalty-points', userId);
  
  const docSnap = await getDoc(loyaltyRef);
  if (!docSnap.exists()) {
    await initializeLoyalty(userId);
  }

  await updateDoc(loyaltyRef, {
    totalPoints: increment(points),
    history: [{
      date: new Date().toISOString(),
      action: description,
      points
    }, ...(docSnap.data()?.history || [])]
  });

  return points;
};

export * from './loyalty/types';
export * from './loyalty/utils';