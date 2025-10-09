import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#ffb700]/5 via-white to-[#ffb700]/10 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="text-center">
        {/* Modern Animated Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#ffb700] to-[#ff9500] rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          
          {/* Rotating Ring */}
          <div className="absolute -inset-2 border-4 border-[#ffb700]/30 border-t-[#ffb700] rounded-full animate-spin"></div>
          
          {/* Floating Dots */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-[#ffb700] rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-[#ffb700]/70 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute top-1/2 -left-4 w-2 h-2 bg-[#ffb700]/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>

        {/* Brand Name with Gradient */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ffb700] to-[#ff9500] bg-clip-text text-transparent mb-4">
          TeknoKapsül
        </h1>
        
        {/* Modern Progress Bar */}
        <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#ffb700] to-[#ff9500] rounded-full shadow-lg animate-pulse" 
            style={{
              width: '70%',
              animation: 'loading-progress 2s ease-in-out infinite'
            }}
          >
          </div>
        </div>
        
        {/* Loading Text with Animation */}
        <div className="space-y-2">
          <p className="text-gray-700 text-lg font-medium animate-pulse">Veriler yükleniyor</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-[#ffb700] rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-[#ffb700] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#ffb700] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
      
      {/* Global CSS for loading animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loading-progress {
            0% { width: 20%; }
            50% { width: 80%; }
            100% { width: 20%; }
          }
        `
      }} />
    </div>
  );
};