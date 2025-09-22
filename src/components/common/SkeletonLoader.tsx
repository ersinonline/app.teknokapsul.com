import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ animationDuration: '1.5s' }}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
};

export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-5 h-5 rounded" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  );
};

export const AIRecommendationsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 min-h-[300px] border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="p-4 rounded-lg min-h-[80px] bg-gray-50 border border-gray-200">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CreditCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <Skeleton className="h-2 w-3/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CargoSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-6 h-6 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};