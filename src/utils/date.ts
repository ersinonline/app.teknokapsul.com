export const calculateDaysRemaining = (dateString: string): number => {
<<<<<<< HEAD
  const target = new Date(dateString);
  const now = new Date();
  
  // Tarihleri UTC'ye çevir
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const timeDiff = target.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
=======
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
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
};

export const isCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
<<<<<<< HEAD
=======
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
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
};