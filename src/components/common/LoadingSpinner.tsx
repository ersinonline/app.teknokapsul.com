import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      <span className="ml-2 text-gray-600">Yükleniyor...</span>
    </div>
  );
};