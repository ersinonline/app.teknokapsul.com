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
import { db } from '../lib/firebase';
import { WorkEntry, WorkSettings, SalaryHistory, SalaryBreakdown } from '../types/work-tracking';

class WorkTrackingService {
  private workEntriesCollection = 'workEntries';
  private workSettingsCollection = 'workSettings';
  private salaryHistoryCollection = 'salaryHistory';

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
      const updateData = { ...updates } as Record<string, any>;
      
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
      const q = query(
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
          hourlyMealRate: data.hourlyMealRate || data.dailyMealAllowance || 0, // Migration support
          dailyMealAllowance: data.dailyMealAllowance, // Keep for backward compatibility
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
    const mealRate = settings.hourlyMealRate || settings.dailyMealAllowance || 0;
    return (workHours * settings.hourlyRate) + 
           (workHours * mealRate) + 
           settings.dailyTransportAllowance;
  }

  calculateMonthlySalary(entries: WorkEntry[], settings: WorkSettings): number {
    const totalHours = entries.reduce((sum, entry) => {
      return sum + this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }, 0);

    const totalDays = entries.length;
    const mealRate = settings.hourlyMealRate || settings.dailyMealAllowance || 0;
    
    return (totalHours * settings.hourlyRate) + 
           (totalHours * mealRate) + 
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

  // New methods for enhanced functionality
  calculateSeparateBreakdown(entries: WorkEntry[], settings: WorkSettings): SalaryBreakdown {
    const totalHours = entries.reduce((sum, entry) => {
      return sum + this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }, 0);

    const totalDays = entries.length;
    const mealRate = settings.hourlyMealRate || settings.dailyMealAllowance || 0;
    
    // Calculate holiday salary
    let regularSalary = 0;
    let overtimeSalary = 0;
    let holidaySalary = 0;
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const workHours = this.calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      const isHoliday = this.isHolidayDate(entryDate);
      
      if (isHoliday) {
        holidaySalary += workHours * settings.hourlyRate; // Holiday double salary
      }
      regularSalary += workHours * settings.hourlyRate;
    });
    
    const baseSalary = regularSalary;
    // Use daily meal allowance for consistency with summary
    const mealAllowance = totalDays * (settings.dailyMealAllowance || 0);
    const transportAllowance = totalDays * settings.dailyTransportAllowance;
    
    return {
      baseSalary,
      overtimeSalary,
      holidaySalary,
      totalSalary: baseSalary + holidaySalary,
      mealAllowance,
      totalMealAllowance: mealAllowance,
      transportAllowance,
      totalTransportAllowance: transportAllowance,
      totalCalculated: baseSalary + holidaySalary + mealAllowance + transportAllowance,
      totalPaid: 0, // Will be set from saved data
      salaryDifference: 0, // Will be calculated
      mealDifference: 0, // Will be calculated
      transportDifference: 0, // Will be calculated
      totalDifference: 0, // Will be calculated
      totalHours,
      totalDays,
      hourlyMealRate: mealRate,
      dailyTransportRate: settings.dailyTransportAllowance,
      hourlyBreakdown: {
        totalHours,
        baseHours: totalHours,
        overtimeHours: 0, // Can be enhanced later
        hourlyRate: settings.hourlyRate,
        hourlyMealRate: mealRate
      }
    };
  }

  // Helper method to check if a date is a holiday
  private isHolidayDate(date: Date): boolean {
    const holidays = this.getHolidays(date.getFullYear());
    return holidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  }

  private getHolidays(year: number): Date[] {
    const holidays: Date[] = [];
    
    // Resmi tatiller
    holidays.push(new Date(year, 0, 1)); // Yılbaşı
    holidays.push(new Date(year, 3, 23)); // Ulusal Egemenlik ve Çocuk Bayramı
    holidays.push(new Date(year, 4, 1)); // İşçi Bayramı
    holidays.push(new Date(year, 4, 19)); // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    holidays.push(new Date(year, 6, 15)); // Demokrasi ve Milli Birlik Günü
    holidays.push(new Date(year, 7, 30)); // Zafer Bayramı
    holidays.push(new Date(year, 9, 29)); // Cumhuriyet Bayramı
    
    // Note: Ramazan and Kurban Bayramı dates would need to be passed as parameters
    // For now, we'll include basic holidays only
    
    return holidays;
  }

  async saveSalaryHistory(salaryHistory: Omit<SalaryHistory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.salaryHistoryCollection), {
        ...salaryHistory,
        createdAt: Timestamp.fromDate(salaryHistory.createdAt),
        updatedAt: Timestamp.fromDate(salaryHistory.updatedAt)
      });
      return docRef.id;
    } catch (error) {
      console.error('Maaş geçmişi kaydetme hatası:', error);
      throw error;
    }
  }

  async getSalaryHistory(userId: string): Promise<SalaryHistory[]> {
    try {
      const q = query(
        collection(db, this.salaryHistoryCollection),
        where('userId', '==', userId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const history: SalaryHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          year: data.year,
          month: data.month,
          paidSalary: data.paidSalary,
          paidMealAllowance: data.paidMealAllowance,
          paidTransportAllowance: data.paidTransportAllowance,
          calculatedSalary: data.calculatedSalary,
          calculatedMealAllowance: data.calculatedMealAllowance,
          calculatedTransportAllowance: data.calculatedTransportAllowance,
          totalHours: data.totalHours,
          totalDays: data.totalDays,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });

      return history;
    } catch (error) {
      console.error('Maaş geçmişi getirme hatası:', error);
      throw error;
    }
  }
}

export const workTrackingService = new WorkTrackingService();
export default workTrackingService;