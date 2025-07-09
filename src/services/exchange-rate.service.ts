import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ExchangeRate {
  id?: string;
  symbol: string; // USD, EUR, GBP, GOLD, etc.
  name: string; // Dolar, Euro, Sterlin, Altın, etc.
  rate: number; // Güncel kur
  date: Date; // Kur tarihi
  createdAt: Date;
  updatedAt: Date;
}

class ExchangeRateService {
  // Günlük kur ekleme
  async addExchangeRate(exchangeRate: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const rateData: Omit<ExchangeRate, 'id'> = {
        ...exchangeRate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'teknokapsul', 'system', 'exchangeRates'), rateData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding exchange rate:', error);
      throw error;
    }
  }

  // Belirli bir sembol için en güncel kuru getirme
  async getCurrentRate(symbol: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'teknokapsul', 'system', 'exchangeRates'),
        where('symbol', '==', symbol),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn(`No exchange rate found for ${symbol}`);
        return 0;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data() as ExchangeRate;
      return data.rate;
    } catch (error) {
      console.error('Error getting current rate for', symbol, ':', error);
      return 0;
    }
  }

  // Tüm güncel kurları getirme
  async getAllCurrentRates(): Promise<ExchangeRate[]> {
    try {
      const symbols = ['USD', 'EUR', 'GBP', 'GOLD', 'XAU', 'SILVER'];
      const rates: ExchangeRate[] = [];
      
      for (const symbol of symbols) {
        const q = query(
          collection(db, 'teknokapsul', 'system', 'exchangeRates'),
          where('symbol', '==', symbol),
          orderBy('date', 'desc'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          rates.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as ExchangeRate);
        }
      }
      
      return rates;
    } catch (error) {
      console.error('Error getting all current rates:', error);
      return [];
    }
  }

  // Belirli bir tarih aralığındaki kurları getirme
  async getRateHistory(symbol: string, startDate: Date, endDate: Date): Promise<ExchangeRate[]> {
    try {
      const q = query(
        collection(db, 'teknokapsul', 'system', 'exchangeRates'),
        where('symbol', '==', symbol),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const rates: ExchangeRate[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rates.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ExchangeRate);
      });
      
      return rates;
    } catch (error) {
      console.error('Error getting rate history:', error);
      return [];
    }
  }

  // Kur güncelleme
  async updateExchangeRate(id: string, updates: Partial<ExchangeRate>): Promise<void> {
    try {
      const docRef = doc(db, 'teknokapsul', 'system', 'exchangeRates', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      throw error;
    }
  }

  // Bugün için kur var mı kontrol etme
  async hasTodayRate(symbol: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const q = query(
        collection(db, 'teknokapsul', 'system', 'exchangeRates'),
        where('symbol', '==', symbol),
        where('date', '>=', today),
        where('date', '<', tomorrow)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking today rate:', error);
      return false;
    }
  }

  // Varsayılan kurları ekleme (ilk kurulum için)
  async initializeDefaultRates(): Promise<void> {
    try {
      const defaultRates = [
        { symbol: 'USD', name: 'Amerikan Doları', rate: 34.50 },
        { symbol: 'EUR', name: 'Euro', rate: 37.20 },
        { symbol: 'GBP', name: 'İngiliz Sterlini', rate: 43.80 },
        { symbol: 'GOLD', name: 'Altın (Gram)', rate: 2850.00 },
        { symbol: 'XAU', name: 'Altın (Gram)', rate: 2850.00 },
        { symbol: 'SILVER', name: 'Gümüş (Gram)', rate: 35.50 }
      ];
      
      const today = new Date();
      
      for (const rate of defaultRates) {
        const hasRate = await this.hasTodayRate(rate.symbol);
        if (!hasRate) {
          await this.addExchangeRate({
            ...rate,
            date: today
          });
        }
      }
    } catch (error) {
      console.error('Error initializing default rates:', error);
      throw error;
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
export default exchangeRateService;