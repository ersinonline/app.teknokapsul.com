export const pointsToTL = (points: number): number => {
  return points / 100;
};

export const formatLoyaltyPoints = (points: number): string => {
  return `${points.toLocaleString('tr-TR')} Puan`;
};