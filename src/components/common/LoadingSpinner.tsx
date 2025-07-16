import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-yellow-800 mb-2">TeknoKapsül</h1>
        <div className="w-32 h-1 bg-yellow-200 rounded-full mx-auto">
          <div className="h-full bg-yellow-600 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      </div>
    </div>
  );
};