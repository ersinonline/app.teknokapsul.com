export const calculateDaysRemaining = (dateString: string): number => {
  if (!dateString) return 0;
  
  const targetDate = new Date(dateString);
  const currentDate = new Date();
  
  // Set both dates to UTC midnight to avoid timezone issues
  targetDate.setUTCHours(0, 0, 0, 0);
  currentDate.setUTCHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Geçersiz tarih';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Geçersiz tarih';
    
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Geçersiz tarih';
  }
};

export const calculateEndDate = (renewalDay: number): Date => {
  const today = new Date();
  const currentDay = today.getDate();
  
  // If renewal day is before current day, set end date to next month
  if (renewalDay <= currentDay) {
    today.setMonth(today.getMonth() + 1);
  }
  
  // Set the day to renewal day
  today.setDate(renewalDay);
  
  // Set time to end of day
  today.setHours(23, 59, 59, 999);
  
  return today;
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth();
};