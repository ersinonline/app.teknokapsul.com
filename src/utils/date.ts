export const calculateDaysRemaining = (dateString: string): number => {
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
};

export const isCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
};