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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { WorkEntry, WorkSettings } from '../types/work-tracking';

class WorkTrackingService {
  private workEntriesCollection = 'workEntries';
  private workSettingsCollection = 'workSettings';

  // Work Entries
  async addWorkEntry(entry: Omit<WorkEntry, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.workEntriesCollection), {
        ...entry,
        createdAt: Timestamp.fromDate(entry.createdAt),
        updatedAt: Timestamp.fromDate(entry.updatedAt)
      });
      return docRef.id;
    } catch (error) {
      console.error('İş girişi ekleme hatası:', error);
      throw error;
    }
  }

  async updateWorkEntry(entryId: string, updates: Partial<WorkEntry>): Promise<void> {
    try {
      const docRef = doc(db, this.workEntriesCollection, entryId);
      const updateData: any = { ...updates };
      
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt);
      }
      if (updates.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(updates.updatedAt);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('İş girişi güncelleme hatası:', error);
      throw error;
    }
  }

  async deleteWorkEntry(entryId: string): Promise<void> {
    try {
      const docRef = doc(db, this.workEntriesCollection, entryId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('İş girişi silme hatası:', error);
      throw error;
    }
  }

  async getWorkEntries(userId: string, month?: number, year?: number): Promise<WorkEntry[]> {
    try {
      let q = query(
        collection(db, this.workEntriesCollection),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let entries: WorkEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          userId: data.userId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          breakMinutes: data.breakMinutes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });

      // Ay ve yıl filtresi uygula
      if (month !== undefined && year !== undefined) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
      }

      return entries;
    } catch (error) {
      console.error('İş girişleri getirme hatası:', error);
      throw error;
    }
  }

  async getWorkEntry(entryId: string): Promise<WorkEntry | null> {
    try {
      const docRef = doc(db, this.workEntriesCollection, entryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          breakMinutes: data.breakMinutes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('İş girişi getirme hatası:', error);
      throw error;
    }
  }

  // Work Settings
  async saveWorkSettings(userId: string, settings: Omit<WorkSettings, 'id' | 'userId'>): Promise<string> {
    try {
      // Mevcut ayarları kontrol et
      const existingSettings = await this.getWorkSettings(userId);
      
      if (existingSettings) {
        // Güncelle
        const docRef = doc(db, this.workSettingsCollection, existingSettings.id);
        await updateDoc(docRef, {
          ...settings,
          updatedAt: Timestamp.fromDate(settings.updatedAt)
        });
        return existingSettings.id;
      } else {
        // Yeni oluştur
        const docRef = await addDoc(collection(db, this.workSettingsCollection), {
          userId,
          ...settings,
          createdAt: Timestamp.fromDate(settings.createdAt),
          updatedAt: Timestamp.fromDate(settings.updatedAt)
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('İş ayarları kaydetme hatası:', error);
      throw error;
    }
  }

  async getWorkSettings(userId: string): Promise<WorkSettings | null> {
    try {
      const q = query(
        collection(db, this.workSettingsCollection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        return {
          id: doc.id,
          userId: data.userId,
          hourlyRate: data.hourlyRate,
          dailyMealAllowance: data.dailyMealAllowance,
          dailyTransportAllowance: data.dailyTransportAllowance,
          dailyHourLimit: data.dailyHourLimit,
          weeklyHourLimit: data.weeklyHourLimit,
          monthlyHourLimit: data.monthlyHourLimit,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('İş ayarları getirme hatası:', error);
      throw error;
    }
  }

  // Utility Methods
  calculateWorkHours(startTime: string, endTime: string, breakMinutes: number): number {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakMinutes / 60));
  }

  calculateDailySalary(workHours: number, settings: WorkSettings): number {
    return (workHours * settings.hourlyRate) + 
           settings.dailyMealAllowance + 
           settings.dailyTransportAllowance;
  }

  calculateMonthlySalary(entries: WorkEntry[], settings: WorkSettings): number {
    const totalHours = entries.reduce((sum, entry) => {
      return sum + this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }, 0);

    const totalDays = entries.length;
    
    return (totalHours * settings.hourlyRate) + 
           (totalDays * settings.dailyMealAllowance) + 
           (totalDays * settings.dailyTransportAllowance);
  }

  checkDailyLimit(workHours: number, settings: WorkSettings): boolean {
    return settings.dailyHourLimit ? workHours > settings.dailyHourLimit : false;
  }

  checkWeeklyLimit(entries: WorkEntry[], settings: WorkSettings): boolean {
    if (!settings.weeklyHourLimit) return false;
    
    const weeklyHours = new Map<string, number>();
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const hours = this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      weeklyHours.set(weekKey, (weeklyHours.get(weekKey) || 0) + hours);
    });
    
    return Array.from(weeklyHours.values()).some(hours => hours > settings.weeklyHourLimit!);
  }

  checkMonthlyLimit(entries: WorkEntry[], settings: WorkSettings): boolean {
    if (!settings.monthlyHourLimit) return false;
    
    const totalHours = entries.reduce((sum, entry) => {
      return sum + this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }, 0);
    
    return totalHours > settings.monthlyHourLimit;
  }

  getWeeklySummary(entries: WorkEntry[], settings: WorkSettings): Map<string, { hours: number; days: number; isOverLimit: boolean }> {
    const weeklyData = new Map<string, { hours: number; days: number; isOverLimit: boolean }>();
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const hours = this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      const existing = weeklyData.get(weekKey) || { hours: 0, days: 0, isOverLimit: false };
      
      existing.hours += hours;
      existing.days += 1;
      existing.isOverLimit = settings.weeklyHourLimit ? existing.hours > settings.weeklyHourLimit : false;
      
      weeklyData.set(weekKey, existing);
    });
    
    return weeklyData;
  }
}

export const workTrackingService = new WorkTrackingService();
export default workTrackingService;