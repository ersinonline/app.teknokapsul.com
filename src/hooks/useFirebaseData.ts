import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Payment } from '../types/data';
import { Expense } from '../types/expense';
import { Subscription } from '../types/subscription';
import { Note } from '../types/notes';
import { Event } from '../types/calendar';

// Additional types for new features
interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  deadline: Date;
  userId: string;
  createdAt: Date;
  targetDate?: Date;
}

interface BudgetPlan {
  id: string;
  name: string;
  totalBudget: number;
  categories: {
    [key: string]: {
      name: string;
      budget: number;
      spent: number;
    };
  };
  period: string;
  month: number;
  year: number;
  userId: string;
  createdAt: Date;
}

interface Warranty {
  id: string;
  productName: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyPeriod: number;
  warrantyEndDate: Date;
  category: string;
  purchasePrice: number;
  store?: string;
  invoiceUrl?: string;
  userId: string;
  createdAt: Date;
}

type DataType = Payment | Expense | Subscription | Note | Event | Goal | BudgetPlan | Warranty;

interface UseFirebaseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export const useFirebaseData = <T extends DataType>(
  collectionName: string,
  documentId?: string
): UseFirebaseDataReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user?.uid) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      if (documentId) {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setData([{ id: docSnap.id, ...docSnap.data() } as T]);
        } else {
          setData([]);
        }
      } else {
        let collectionRef;
        let q;

        switch (collectionName) {
          case 'notes':
          case 'events':
          case 'financial':
          case 'goals':
          case 'budget':
          case 'warranties':
          case 'subscriptions':
            collectionRef = collection(db, 'teknokapsul', user.uid, collectionName);
            q = query(collectionRef);
            break;
          case 'expenses':
            collectionRef = collection(db, collectionName);
            q = query(collectionRef, where('userId', '==', user.uid));
            break;
          case 'payments':
            collectionRef = collection(db, 'teknokapsul', user.uid, collectionName);
            q = query(collectionRef);
            break;
          default:
            collectionRef = collection(db, collectionName);
            q = query(collectionRef, where('userId', '==', user.uid));
            break;
        }

        const querySnapshot = await getDocs(q);
        const documents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Abonelikler için özel dönüşüm
          if (collectionName === 'subscriptions') {
            return {
              id: doc.id,
              name: data.name,
              endDate: data.subscriptionEndDate,
              userId: data.userId,
              isActive: data.isActive !== undefined ? data.isActive : true,
              autoRenew: data.autoRenew || false,
              renewalDay: data.renewalDay,
              price: data.price || 0,
              lastRenewalDate: data.lastRenewalDate
            } as T;
          }
          return {
            id: doc.id,
            ...data
          } as T;
        });
        
        setData(documents);
      }
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName, documentId, user]);

  return { data, loading, error, reload: fetchData };
};