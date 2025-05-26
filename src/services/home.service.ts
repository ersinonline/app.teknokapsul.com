import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Home, HomeFormData } from '../types/home';

export const getUserHomes = async (userId: string): Promise<Home[]> => {
  try {
    const homesRef = collection(db, 'homes');
    const q = query(homesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Home));
  } catch (error) {
    console.error('Error fetching homes:', error);
    throw error;
  }
};

export const addHome = async (userId: string, data: HomeFormData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'homes'), {
      ...data,
      userId,
      documents: {
        bills: []
      },
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding home:', error);
    throw error;
  }
};

export const uploadHomeDocument = async (
  homeId: string,
  documentType: 'contract' | 'bills',
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(storage, `homes/${homeId}/${documentType}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    
    const homeRef = doc(db, 'homes', homeId);
    if (documentType === 'contract') {
      await updateDoc(homeRef, {
        'documents.contract': url
      });
    } else {
      await updateDoc(homeRef, {
        'documents.bills': arrayUnion(url)
      });
    }
    
    return url;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};