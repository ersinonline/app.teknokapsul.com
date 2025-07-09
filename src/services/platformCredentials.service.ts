import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PlatformCredential {
  id: string;
  platformName: string;
  platformEmail: string;
  password: string;
}

export const getPlatformCredentialsByUserId = async (
  userId: string
): Promise<PlatformCredential[]> => {
  try {
    const credentialsRef = collection(db, 'teknokapsul', userId, 'credentials');
    const q = query(credentialsRef);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      platformName: doc.data().platformName, // Platform adı
      platformEmail: doc.data().platformEmail, // Platform e-posta adresi
      password: doc.data().password, // Şifre
    }));
  } catch (error) {
    console.error('Error fetching platform credentials:', error);
    throw new Error('Veriler yüklenirken bir hata oluştu.');
  }
};