import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Application } from '../types/data';

export const getUserApplications = async (email: string): Promise<Application[]> => {
  try {
    const applicationsRef = collection(db, 'applications');
    const q = query(applicationsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Application));
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};