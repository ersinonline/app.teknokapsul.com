import React from 'react';
import { Crown } from 'lucide-react';
import { usePremium } from '../../contexts/PremiumContext';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const { isPremium, loading } = usePremium();

  if (loading || !isPremium) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}>
      <div className="relative">
        <img 
          src="/premium.png" 
          alt="Premium" 
          className={`${iconSizes[size]} object-contain`}
        />
      </div>
      {showText && (
        <span className="font-medium text-yellow-600">
          Premium
        </span>
      )}
    </div>
  );
};

// Premium feature lock component
interface PremiumLockProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ 
  feature, 
  children, 
  fallback 
}) => {
  const { hasFeature, isPremium } = usePremium();

  if (isPremium && hasFeature(feature as any)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
        <div className="bg-white rounded-lg p-3 shadow-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-600">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Premium Özellik</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Premium upgrade prompt
interface PremiumPromptProps {
  feature: string;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
}

export const PremiumPrompt: React.FC<PremiumPromptProps> = ({
  feature,
  title = "Premium Özellik",
  description = "Bu özelliği kullanmak için Premium üyelik gereklidir.",
  onUpgrade
}) => {
  const { isPremium, hasFeature } = usePremium();

  if (isPremium && hasFeature(feature as any)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Crown className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Crown className="w-4 h-4" />
            Premium'a Yükselt
          </button>
        </div>
      </div>
    </div>
  );
};