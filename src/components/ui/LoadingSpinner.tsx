import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'border-blue-500' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size]} 
          ${color}
          border-t-transparent
          rounded-full
          animate-spin
        `}
      ></div>
    </div>
  );
};

// Full Page Loading
export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <LoadingSpinner size="lg" color="border-gradient-primary" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Yükleniyor...</p>
      </div>
    </div>
  );
};

// Skeleton Loader
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton rounded ${className}`}></div>
  );
};
