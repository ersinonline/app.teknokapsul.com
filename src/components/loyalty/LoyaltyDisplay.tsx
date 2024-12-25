import React from 'react';
import { Award } from 'lucide-react';
import { LoyaltyPoints } from '../../services/loyalty/types';
import { formatLoyaltyPoints, pointsToTL } from '../../services/loyalty/utils';

interface LoyaltyDisplayProps {
  loyalty: LoyaltyPoints;
}

export const LoyaltyDisplay: React.FC<LoyaltyDisplayProps> = ({ loyalty }) => {
  const tlValue = pointsToTL(loyalty.totalPoints);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Award className="w-4 h-4 text-yellow-600" />
      <span>{formatLoyaltyPoints(loyalty.totalPoints)}</span>
      <span className="text-gray-500">({tlValue.toFixed(2)} TL değerinde)</span>
    </div>
  );
};