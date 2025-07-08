import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Payment } from '../types/data';
import { Subscription } from '../types/subscription';

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

export interface BudgetCategory {
  id?: string;
  userId: string;
  name: string;
  monthlyLimit: number;
  currentSpent: number;
  color: string;
  icon: string;
  alertThreshold: number; // percentage
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AIInsight {
  id?: string;
  userId: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_alert' | 'prediction' | 'recommendation';
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
      const docRef = doc(db, 'userPreferences', userId);
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
      const docRef = doc(db, 'userPreferences', userId);
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async createUserPreferences(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'userPreferences'), {
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  // Financial Goals
  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    try {
      const q = query(
        collection(db, 'financialGoals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialGoal));
    } catch (error) {
      console.error('Error getting financial goals:', error);
      throw error;
    }
  }

  async createFinancialGoal(goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'financialGoals'), {
        ...goal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating financial goal:', error);
      throw error;
    }
  }

  async updateFinancialGoal(goalId: string, updates: Partial<FinancialGoal>): Promise<void> {
    try {
      const docRef = doc(db, 'financialGoals', goalId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating financial goal:', error);
      throw error;
    }
  }

  async deleteFinancialGoal(goalId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'financialGoals', goalId));
    } catch (error) {
      console.error('Error deleting financial goal:', error);
      throw error;
    }
  }

  // Budget Categories
  async getBudgetCategories(userId: string): Promise<BudgetCategory[]> {
    try {
      const q = query(
        collection(db, 'budgetCategories'),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
    } catch (error) {
      console.error('Error getting budget categories:', error);
      throw error;
    }
  }

  async createBudgetCategory(category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'budgetCategories'), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating budget category:', error);
      throw error;
    }
  }

  async updateBudgetCategory(categoryId: string, updates: Partial<BudgetCategory>): Promise<void> {
    try {
      const docRef = doc(db, 'budgetCategories', categoryId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating budget category:', error);
      throw error;
    }
  }

  // AI Insights
  async getAIInsights(userId: string, unreadOnly: boolean = false): Promise<AIInsight[]> {
    try {
      let q = query(
        collection(db, 'aiInsights'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'aiInsights'),
          where('userId', '==', userId),
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

  async createAIInsight(insight: Omit<AIInsight, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'aiInsights'), {
        ...insight,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating AI insight:', error);
      throw error;
    }
  }

  async markInsightAsRead(insightId: string): Promise<void> {
    try {
      const docRef = doc(db, 'aiInsights', insightId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      throw error;
    }
  }

  // Batch Operations
  async batchUpdatePayments(updates: { id: string; data: Partial<Payment> }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const docRef = doc(db, 'payments', id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error batch updating payments:', error);
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
  subscribeToPayments(userId: string, callback: (payments: Payment[]) => void): () => void {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    });
  }

  subscribeToSubscriptions(userId: string, callback: (subscriptions: Subscription[]) => void): () => void {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const subscriptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      callback(subscriptions);
    });
  }

  subscribeToAIInsights(userId: string, callback: (insights: AIInsight[]) => void): () => void {
    const q = query(
      collection(db, 'aiInsights'),
      where('userId', '==', userId),
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

  // Analytics
  async getSpendingAnalytics(userId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      
      // Process analytics data
      const analytics = {
        totalSpent: payments.reduce((sum, payment) => sum + payment.amount, 0),
        transactionCount: payments.length,
        averageTransaction: payments.length > 0 ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length : 0,
        categoryBreakdown: {},
        dailySpending: {},
        trends: []
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting spending analytics:', error);
      throw error;
    }
  }
}

export const enhancedFirebaseService = new EnhancedFirebaseService();