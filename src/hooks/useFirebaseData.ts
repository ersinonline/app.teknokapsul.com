import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Application, Payment } from '../types/data';
import { Subscription } from '../types/subscription';
import { Note } from '../types/notes';
import { Event } from '../types/calendar';

type DataType = Order | Application | Payment | Subscription | Note | Event;

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
        const collectionRef = collection(db, collectionName === 'subscriptions' ? 'subscription-end' : collectionName);
        let q = query(collectionRef);

        switch (collectionName) {
          case 'orders':
          case 'applications':
            q = query(collectionRef, where('email', '==', user.email));
            break;
          case 'payments':
          case 'notes':
          case 'events':
          case 'subscriptions':
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
              userId: data.userId
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