import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface UserPreferences {
  id?: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
  currency: 'TRY' | 'USD' | 'EUR';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    paymentReminders: boolean;
    subscriptionAlerts: boolean;
  };
  aiSettings: {
    enabled: boolean;
    autoAnalysis: boolean;
    voiceEnabled: boolean;
    language: 'tr' | 'en';
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FinancialGoal {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: 'saving' | 'debt' | 'investment' | 'emergency' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AIInsight {
  id?: string;
  userId: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  category: 'warning' | 'opportunity' | 'saving' | 'info';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
  relatedData?: any;
  isRead: boolean;
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
}

class EnhancedFirebaseService {
  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const docRef = doc(db, 'teknokapsul', userId, 'settings', 'preferences');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserPreferences;
      }
      return null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const docRef = doc(db, 'teknokapsul', userId, 'settings', 'preferences');
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async createUserPreferences(userId: string, preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> {
    try {
      const docRef = doc(db, 'teknokapsul', userId, 'settings', 'preferences');
      await setDoc(docRef, {
        ...preferences,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }



  // AI Insights
  async getAIInsights(userId: string, unreadOnly: boolean = false): Promise<AIInsight[]> {
    try {
      let q = query(
        collection(db, 'teknokapsul', userId, 'insights'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'teknokapsul', userId, 'insights'),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIInsight));
    } catch (error) {
      console.error('Error getting AI insights:', error);
      throw error;
    }
  }

  async createAIInsight(userId: string, insight: Omit<AIInsight, 'id' | 'createdAt' | 'userId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'insights'), {
        ...insight,
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating AI insight:', error);
      throw error;
    }
  }

  async markInsightAsRead(userId: string, insightId: string): Promise<void> {
    try {
      const docRef = doc(db, 'teknokapsul', userId, 'insights', insightId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      throw error;
    }
  }



  // File Upload
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Real-time Subscriptions

  subscribeToAIInsights(userId: string, callback: (insights: AIInsight[]) => void): () => void {
    const q = query(
      collection(db, 'teknokapsul', userId, 'insights'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const insights = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIInsight));
      callback(insights);
    });
  }

  // Generic CRUD Operations
  async create(collectionName: string, data: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async read(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error(`Error reading document from ${collectionName}:`, error);
      throw error;
    }
  }

  async update(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }


}

export const enhancedFirebaseService = new EnhancedFirebaseService();