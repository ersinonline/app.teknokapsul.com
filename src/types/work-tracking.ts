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
  hourlyMealRate: number; // Saatlik yemek ücreti (₺)
  dailyTransportAllowance: number; // Günlük yol ücreti (₺)
  dailyHourLimit?: number; // Günlük maksimum çalışma saati
  weeklyHourLimit?: number; // Haftalık maksimum çalışma saati
  monthlyHourLimit?: number; // Aylık maksimum çalışma saati
  includeRamadanBayram?: boolean; // Ramazan Bayramı dahil edilsin mi
  includeCurbanBayram?: boolean; // Kurban Bayramı dahil edilsin mi
  createdAt: Date;
  updatedAt: Date;
  // Backward compatibility
  dailyMealAllowance?: number; // Deprecated - use hourlyMealRate instead
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

export interface SalaryHistory {
  id: string;
  userId: string;
  year: number;
  month: number; // 0-11 (JavaScript month format)
  paidSalary: number;
  paidMealAllowance: number;
  paidTransportAllowance: number;
  calculatedSalary: number;
  calculatedMealAllowance: number;
  calculatedTransportAllowance: number;
  totalHours: number;
  totalDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryBreakdown {
  baseSalary: number;
  overtimeSalary: number;
  holidaySalary: number;
  totalSalary: number;
  mealAllowance: number;
  totalMealAllowance: number;
  transportAllowance: number;
  totalTransportAllowance: number;
  totalCalculated: number;
  totalPaid: number;
  salaryDifference: number;
  mealDifference: number;
  transportDifference: number;
  totalDifference: number;
  totalHours: number;
  totalDays: number;
  hourlyMealRate: number;
  dailyTransportRate: number;
  hourlyBreakdown: {
    totalHours: number;
    baseHours: number;
    overtimeHours: number;
    hourlyRate: number;
    hourlyMealRate: number;
  };
}