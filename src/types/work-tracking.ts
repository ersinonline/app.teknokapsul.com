export interface WorkEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSettings {
  id: string;
  userId: string;
  hourlyRate: number; // Saatlik ücret (₺)
  dailyMealAllowance: number; // Günlük yemek ücreti (₺)
  dailyTransportAllowance: number; // Günlük yol ücreti (₺)
  dailyHourLimit?: number; // Günlük maksimum çalışma saati
  weeklyHourLimit?: number; // Haftalık maksimum çalışma saati
  monthlyHourLimit?: number; // Aylık maksimum çalışma saati
  includeRamadanBayram?: boolean; // Ramazan Bayramı dahil edilsin mi
  includeCurbanBayram?: boolean; // Kurban Bayramı dahil edilsin mi
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSummary {
  totalHours: number;
  totalDays: number;
  totalSalary: number;
  isOverMonthlyLimit: boolean;
  isOverWeeklyLimit: boolean;
  isOverDailyLimit: boolean;
  monthlyHourLimit?: number;
  weeklyHourLimit?: number;
  dailyHourLimit?: number;
}

export interface WeeklyWorkSummary {
  weekStart: string;
  totalHours: number;
  totalDays: number;
  isOverLimit: boolean;
}

export interface DailyWorkSummary {
  date: string;
  hours: number;
  isOverLimit: boolean;
  salary: number;
}