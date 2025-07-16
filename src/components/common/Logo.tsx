import React from 'react';
import { Package } from 'lucide-react';
import { PremiumBadge } from '../premium/premiumbadge';

interface LogoProps {
  className?: string;
  showPremium?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, showPremium = true }) => {
  return (
    <div className={`flex items-center justify-start ml-4 ${className}`}>
      <Package className="w-8 h-8 text-yellow-600" />
      <div className="ml-2 flex flex-col">
        <span className="text-xl font-bold text-gray-900">TeknoKapsül</span>
        {showPremium && (
          <div className="flex justify-center mt-0.5">
            <PremiumBadge size="sm" showText={false} />
          </div>
        )}
      </div>
    </div>
  );
};